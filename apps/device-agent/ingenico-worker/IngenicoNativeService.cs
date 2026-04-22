using System.Globalization;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace PrintServer.IngenicoWorker;

internal sealed class IngenicoNativeService
{
    private const uint TransactionResultOk = 0;
    private const uint TransactionAlreadyDone = 2080;
    private const uint PairingRequiredAppError = 2329;
    private const uint PaymentBankCard = 0x0000000000000004;
    private const uint PaymentSubtypeSale = 0x00000001;
    private const uint BankTranFlagSoftCopySupportForMerchantCopy = 0x00080000;
    private const uint BankTranFlagManualPanEntryNotAllowed = 0x80000000;
    private const uint DllRetcodePortNotOpen = 0xF000;
    private const uint DllRetcodeTimeout = 0xF003;
    private const uint DllRetcodeRecvBusy = 0xF01C;
    private const uint DllRetcodePairingRequired = 0xF020;
    private const uint DllRetcodeInterfaceAlreadyExist = 0xF037;
    private const byte TransactionStatusReserved = 2;
    private const int ItemTypeDepartment = 1;
    private const int ItemUnitNumber = 1;
    private const int TicketTypeProcessSale = 1;
    private const uint PrintStyleHuge = 1u << 13;
    private const uint PrintStyleBold = 1u << 3;
    private const uint PrintStyleCenter = 1u << 4;
    private const int PaymentRequestMinimumTimeoutMs = 60000;
    private const int PaymentRequestMaximumTimeoutMs = 300000;
    private const ulong EchoOptions = 0x00000007;
    private const int BufferSize = 256 * 1024;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IngenicoSettings settings;
    private readonly string runtimeDirectory;
    private readonly IngenicoErrorCatalog errorCatalog;

    public IngenicoNativeService(IngenicoSettings settings, string runtimeDirectory)
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        this.settings = settings;
        this.runtimeDirectory = runtimeDirectory;
        errorCatalog = new IngenicoErrorCatalog(runtimeDirectory);
    }

    public WorkerResponse TestConnection()
    {
        if (!settings.Enabled)
        {
            return Failure("Ingenico ayari kapali. Once etkinlestirin.");
        }

        try
        {
            EnsureNativePrerequisites();
            ProbeTransportConnectivity();
            ConfigureGmpXml();
            var interfaceHandle = EnsureInterface();

            if (settings.UseEchoHealthCheck)
            {
                EnsureEcho(interfaceHandle);
            }

            return Success("Ingenico baglanti testi basarili.");
        }
        catch (Exception exception)
        {
            return Failure(exception.Message);
        }
    }

    public WorkerResponse RunPrecheck()
    {
        if (!settings.Enabled)
        {
            return new WorkerResponse
            {
                IsSuccess = false,
                Operation = "precheck",
                IsReady = false,
                Message = "Ingenico ayari kapali. Once etkinlestirin.",
            };
        }

        try
        {
            EnsureNativePrerequisites();
            ProbeTransportConnectivity();
            ConfigureGmpXml();
            var interfaceHandle = EnsureInterface();

            if (settings.UseEchoHealthCheck)
            {
                EnsureEcho(interfaceHandle);
            }

            var pairingStatusRetcode = NativeMethods.FP3_IsGmpPairingDone(interfaceHandle);
            if (pairingStatusRetcode == TransactionResultOk)
            {
                return new WorkerResponse
                {
                    IsSuccess = false,
                    Operation = "precheck",
                    IsReady = false,
                    IsPairingRequired = true,
                    Message = "Ingenico cihazi pairing istiyor. Pairing islemini baslatin.",
                };
            }

            return new WorkerResponse
            {
                IsSuccess = true,
                Operation = "precheck",
                IsReady = true,
                IsPairingRequired = false,
                Message = "Ingenico odeme icin hazir.",
            };
        }
        catch (Exception exception)
        {
            var requiresPairing = exception.Message.Contains("pairing", StringComparison.OrdinalIgnoreCase);
            return new WorkerResponse
            {
                IsSuccess = false,
                Operation = "precheck",
                IsReady = false,
                IsPairingRequired = requiresPairing,
                Message = requiresPairing
                    ? "Ingenico cihazi pairing istiyor. Pairing islemini baslatin."
                    : exception.Message,
            };
        }
    }

    public WorkerResponse StartPairing()
    {
        if (!settings.Enabled)
        {
            return Failure("Ingenico ayari kapali. Once etkinlestirin.", "pairing");
        }

        try
        {
            EnsureNativePrerequisites();
            ProbeTransportConnectivity();
            ConfigureGmpXml();
            var interfaceHandle = EnsureInterface();

            if (settings.UseEchoHealthCheck)
            {
                EnsureEcho(interfaceHandle);
            }

            var now = DateTime.Now;
            var requestObj = new
            {
                szProcOrderNumber = "000001",
                szProcDate = now.ToString("yyMMdd", CultureInfo.InvariantCulture),
                szProcTime = now.ToString("HHmmss", CultureInfo.InvariantCulture),
                szExternalDeviceBrand = "WORLDLINE",
                szExternalDeviceModel = "IWE280",
                szExternalDeviceSerialNumber = "12344567",
                szEcrSerialNumber = "PS000001"
            };

            var requestBytes = ToAnsiBytes(JsonSerializer.Serialize(requestObj));
            var responseBytes = new byte[BufferSize];
            var retcode = NativeMethods.Json_FP3_StartPairingInit(interfaceHandle, requestBytes, responseBytes, responseBytes.Length);
            if (retcode != TransactionResultOk)
            {
                throw new InvalidOperationException("Ingenico pairing baslatilamadi: " + ResolveError(retcode));
            }

            return new WorkerResponse
            {
                IsSuccess = true,
                Operation = "pairing",
                IsReady = true,
                Message = "Ingenico pairing baslatildi. Cihaz ekranindaki eslestirme adimini tamamlayin.",
                Details = ReadJson(responseBytes)
            };
        }
        catch (Exception exception)
        {
            return Failure(exception.Message, "pairing");
        }
    }

    public WorkerResponse ProcessPayment(PaymentRequest? paymentRequest)
    {
        if (paymentRequest is null)
        {
            return Failure("Odeme istegi bulunamadi.", "payment");
        }

        if (paymentRequest.Amount <= 0)
        {
            return Failure("Odeme tutari sifirdan buyuk olmali.", "payment");
        }

        try
        {
            EnsureNativePrerequisites();
            ProbeTransportConnectivity();
            ConfigureGmpXml();
            var interfaceHandle = EnsureInterface();
            CleanupReservedTransactions(interfaceHandle);

            if (settings.UseEchoHealthCheck)
            {
                EnsureEcho(interfaceHandle);
            }

            ulong transactionHandle = 0;
            var shouldCloseTransaction = false;

            try
            {
                StartTransaction(interfaceHandle, ref transactionHandle);
                shouldCloseTransaction = true;

                ExecuteAndEnsure(
                    NativeMethods.FP3_TicketHeader(interfaceHandle, transactionHandle, TicketTypeProcessSale, settings.DefaultTimeoutMs),
                    "Fis basligi acilamadi");

                ulong activeFlags = 0;
                ExecuteAndEnsure(
                    NativeMethods.FP3_OptionFlags(interfaceHandle, transactionHandle, ref activeFlags, EchoOptions, 0, settings.DefaultTimeoutMs),
                    "Fis secenekleri uygulanamadi");

                foreach (var item in GetEffectiveItems(paymentRequest))
                {
                    SendItem(interfaceHandle, transactionHandle, item);
                }

                SendPayment(interfaceHandle, transactionHandle, paymentRequest.Amount, paymentRequest.CustomerReference);

                ExecuteAndEnsure(
                    NativeMethods.FP3_PrintTotalsAndPayments(interfaceHandle, transactionHandle, settings.DefaultTimeoutMs),
                    "Toplam ve odeme bilgileri yazdirilamadi");
                PrintQueueNumber(interfaceHandle, transactionHandle, paymentRequest.CustomerReference);
                ExecuteAndEnsure(
                    NativeMethods.FP3_PrintBeforeMF(interfaceHandle, transactionHandle, settings.DefaultTimeoutMs),
                    "Mali oncesi satirlar yazdirilamadi");
                ExecuteAndEnsure(
                    NativeMethods.FP3_PrintMF(interfaceHandle, transactionHandle, settings.CardTimeoutMs),
                    "Mali fis tamamlanamadi");

                var close = CloseTransaction(interfaceHandle, transactionHandle);
                shouldCloseTransaction = false;
                transactionHandle = 0;

                return new WorkerResponse
                {
                    IsSuccess = true,
                    Operation = "payment",
                    IsReady = true,
                    Message = "Ingenico odeme basarili.",
                    OrderNumber = $"{close.ZNo:0000}-{close.FisNo:000000}",
                    ReceiptAmount = paymentRequest.Amount,
                    CustomerReference = paymentRequest.CustomerReference
                };
            }
            catch (Exception)
            {
                if (transactionHandle != 0)
                {
                    TryRecoverTransaction(interfaceHandle, transactionHandle);
                    shouldCloseTransaction = false;
                }

                throw;
            }
            finally
            {
                if (shouldCloseTransaction && transactionHandle != 0)
                {
                    TryClose(interfaceHandle, transactionHandle);
                }
            }
        }
        catch (Exception exception)
        {
            return Failure(exception.Message, "payment");
        }
    }

    public WorkerResponse CancelActivePayment()
    {
        try
        {
            EnsureNativePrerequisites();
            ProbeTransportConnectivity();
            ConfigureGmpXml();
            var interfaceHandle = EnsureInterface();
            CleanupReservedTransactions(interfaceHandle);

            return new WorkerResponse
            {
                IsSuccess = true,
                Operation = "cancel",
                IsReady = true,
                Message = "Bekleyen Ingenico islemleri temizlendi.",
            };
        }
        catch (Exception exception)
        {
            return Failure(exception.Message, "cancel");
        }
    }

    private void EnsureNativePrerequisites()
    {
        if (!OperatingSystem.IsWindows())
        {
            throw new IngenicoUnavailableException("Gercek Ingenico entegrasyonu yalnizca Windows ortaminda calisir.");
        }

        var dllPath = Path.Combine(runtimeDirectory, "GMPSmartDLL.dll");
        var xmlPath = Path.Combine(runtimeDirectory, "GMP.XML");

        if (!File.Exists(dllPath))
        {
            throw new IngenicoUnavailableException("GMPSmartDLL.dll bulunamadi.");
        }

        if (!File.Exists(xmlPath))
        {
            throw new IngenicoUnavailableException("GMP.XML bulunamadi.");
        }

        NativeLibrary.SetDllImportResolver(typeof(IngenicoNativeService).Assembly, ResolveNativeLibrary);
    }

    private IntPtr ResolveNativeLibrary(string libraryName, System.Reflection.Assembly assembly, DllImportSearchPath? searchPath)
    {
        if (!string.Equals(libraryName, "GmpSmartDLL.dll", StringComparison.OrdinalIgnoreCase))
        {
            return IntPtr.Zero;
        }

        var dllPath = Path.Combine(runtimeDirectory, "GMPSmartDLL.dll");
        return NativeLibrary.TryLoad(dllPath, assembly, searchPath, out var handle) ? handle : IntPtr.Zero;
    }

    private uint EnsureInterface()
    {
        uint interfaceHandle = 0;
        var interfaceIdBytes = ToAnsiBytes(settings.InterfaceId);
        var retcode = NativeMethods.FP3_GetInterfaceHandleByID(ref interfaceHandle, interfaceIdBytes);

        var interfaceData = new NativeInterfaceXmlData
        {
            RetryCounter = (byte)settings.RetryCounter,
            IpRetryCount = (byte)settings.IpRetryCount,
            AckTimeOut = (uint)settings.AckTimeoutMs,
            CommTimeOut = (uint)settings.CommTimeoutMs,
            InterCharacterTimeOut = (uint)settings.InterCharacterTimeoutMs,
            PortName = settings.PortName,
            BaudRate = settings.BaudRate,
            ByteSize = settings.ByteSize,
            fParity = 0,
            Parity = settings.Parity,
            StopBit = settings.StopBit,
            IsTcpConnection = (byte)(IsTcpConnection() ? 1 : 0),
            IP = settings.IpAddress,
            Port = settings.Port,
            IsTcpKeepAlive = (byte)(settings.IsTcpKeepAlive ? 1 : 0)
        };

        var jsonBytes = ToJsonBytes(interfaceData);

        if (retcode != TransactionResultOk || interfaceHandle == 0)
        {
            try
            {
                NativeMethods.FP3_CloseInterfaceByID(interfaceIdBytes);
            }
            catch
            {
            }

            retcode = NativeMethods.Json_FP3_CreateInterface(ref interfaceHandle, interfaceIdBytes, 1, jsonBytes);
            if (retcode != TransactionResultOk && retcode != DllRetcodeInterfaceAlreadyExist)
            {
                throw new IngenicoUnavailableException(ResolveError(retcode));
            }
        }

        retcode = NativeMethods.Json_FP3_UpdateInterfaceXmlDataByID(interfaceIdBytes, jsonBytes);
        if (retcode != TransactionResultOk)
        {
            throw new IngenicoUnavailableException(ResolveError(retcode));
        }

        interfaceHandle = 0;
        retcode = NativeMethods.FP3_GetInterfaceHandleByID(ref interfaceHandle, interfaceIdBytes);
        if (retcode != TransactionResultOk || interfaceHandle == 0)
        {
            throw new IngenicoUnavailableException(ResolveError(retcode));
        }

        return interfaceHandle;
    }

    private void EnsureEcho(uint interfaceHandle)
    {
        var buffer = new byte[BufferSize];
        var retcode = NativeMethods.Json_FP3_Echo(interfaceHandle, buffer, buffer.Length, settings.EchoTimeoutMs);
        if (retcode == TransactionResultOk || retcode == DllRetcodeRecvBusy)
        {
            return;
        }

        if (retcode == DllRetcodePortNotOpen || retcode == DllRetcodeTimeout)
        {
            throw new IngenicoUnavailableException(ResolveError(retcode));
        }

        throw new InvalidOperationException(ResolveError(retcode));
    }

    private void ProbeTransportConnectivity()
    {
        if (!IsTcpConnection())
        {
            return;
        }

        try
        {
            using var client = new TcpClient();
            var connectTask = client.ConnectAsync(settings.IpAddress, settings.Port);
            var connected = connectTask.Wait(TimeSpan.FromMilliseconds(settings.EchoTimeoutMs > 0 ? settings.EchoTimeoutMs : 2000));

            if (!connected || !client.Connected)
            {
                _ = connectTask.ContinueWith(task => _ = task.Exception, TaskContinuationOptions.OnlyOnFaulted);
                throw new IngenicoUnavailableException($"Cihaza ulasilamiyor: {settings.IpAddress}:{settings.Port}");
            }
        }
        catch (IngenicoUnavailableException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new IngenicoUnavailableException($"TCP baglantisi kurulamadi: {exception.Message}");
        }
    }

    private string ResolveError(uint errorCode)
    {
        if (errorCode == DllRetcodeTimeout)
        {
            return "POS cihazi zaman asimina ugradi.";
        }

        try
        {
            var buffer = new byte[1024];
            NativeMethods.GetErrorTurkishDescription(errorCode, buffer);
            var message = ReadAnsi(buffer).Trim();
            if (!string.IsNullOrWhiteSpace(message))
            {
                return $"{message} ({errorCode.ToString(CultureInfo.InvariantCulture)})";
            }
        }
        catch
        {
        }

        var fallback = errorCatalog.GetMessage(errorCode);
        if (!string.IsNullOrWhiteSpace(fallback))
        {
            return $"{fallback} ({errorCode.ToString(CultureInfo.InvariantCulture)})";
        }

        return $"Ingenico hata kodu: {errorCode.ToString(CultureInfo.InvariantCulture)}";
    }

    private void StartTransaction(uint interfaceHandle, ref ulong transactionHandle)
    {
        var uniqueId = new byte[24];
        RandomNumberGenerator.Fill(uniqueId);
        var retcode = NativeMethods.FP3_Start(
            interfaceHandle,
            ref transactionHandle,
            0,
            uniqueId,
            uniqueId.Length,
            Array.Empty<byte>(),
            0,
            Array.Empty<byte>(),
            0,
            settings.DefaultTimeoutMs);

        if (retcode == TransactionAlreadyDone)
        {
            throw new InvalidOperationException("Cihaz uzerinde tamamlanmamis bir islem var. Once iptal edin.");
        }

        if (retcode == PairingRequiredAppError || retcode == DllRetcodePairingRequired)
        {
            throw new InvalidOperationException("pairing");
        }

        ExecuteAndEnsure(retcode, "Fis islemi baslatilamadi");
    }

    private void SendItem(uint interfaceHandle, ulong transactionHandle, PaymentItem item)
    {
        var nativeItem = new NativeItem
        {
            type = (byte)ItemTypeDepartment,
            subType = 0,
            deptIndex = (byte)Math.Max(0, settings.DefaultDepartmentIndex - 1),
            unitType = (byte)ItemUnitNumber,
            amount = ToMinorUnit(item.UnitPrice),
            currency = (ushort)settings.DefaultCurrencyCode,
            count = (uint)Math.Max(1, item.Quantity),
            flag = 0,
            countPrecition = 0,
            pluPriceIndex = 0,
            name = Trim(item.Name, 32),
            barcode = string.Empty,
            firm = string.Empty,
            invoiceNo = string.Empty,
            subscriberId = string.Empty,
            tckno = string.Empty,
            Reserved = 0,
            szDate = string.Empty,
            promotion = new NativePromotion(),
            OnlineInvoiceItemExceptionCode = 0
        };

        var itemOut = new byte[BufferSize];
        var ticketOut = new byte[BufferSize];
        var retcode = NativeMethods.Json_FP3_ItemSale(
            interfaceHandle,
            transactionHandle,
            ToJsonBytes(nativeItem),
            itemOut,
            itemOut.Length,
            ticketOut,
            ticketOut.Length,
            settings.DefaultTimeoutMs);

        ExecuteAndEnsure(retcode, item.Name + " urunu cihaza gonderilemedi");
    }

    private void SendPayment(uint interfaceHandle, ulong transactionHandle, decimal amount, string customerReference)
    {
        var paymentRequest = new NativePaymentRequest
        {
            typeOfPayment = PaymentBankCard,
            subtypeOfPayment = PaymentSubtypeSale,
            payAmount = ToMinorUnit(amount),
            payAmountBonus = 0,
            payAmountCurrencyCode = (ushort)settings.DefaultCurrencyCode,
            bankBkmId = 0,
            numberOfinstallments = 0,
            terminalId = new byte[8],
            BankPaymentUniqueId = DateTime.Now.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
            OrgTransData = new NativeOriginalPaymentData(),
            batchNo = 0,
            stanNo = 0,
            rawDataLen = 0,
            rawData = new byte[512],
            paymentName = string.IsNullOrWhiteSpace(customerReference) ? "Kredi Karti" : "Siparis " + customerReference,
            paymentInfo = string.IsNullOrWhiteSpace(customerReference) ? "PrintServer kart odemesi" : "Musteri No: " + customerReference,
            transactionFlag = BuildPaymentFlags(),
            flags = 0,
            LoyaltyCustomerId = customerReference,
            PaymentProvisionId = string.Empty,
            LoyaltyServiceId = 0,
            AllowedInput = 0
        };

        var paymentOut = new byte[BufferSize];
        var ticketOut = new byte[BufferSize];
        var retcode = NativeMethods.Json_FP3_Payment(
            interfaceHandle,
            transactionHandle,
            ToJsonBytes(paymentRequest),
            paymentOut,
            paymentOut.Length,
            ticketOut,
            ticketOut.Length,
            Math.Clamp(settings.CardTimeoutMs, PaymentRequestMinimumTimeoutMs, PaymentRequestMaximumTimeoutMs));

        ExecuteAndEnsure(retcode, "Kart odemesi basarisiz oldu");
    }

    private void PrintQueueNumber(uint interfaceHandle, ulong transactionHandle, string customerReference)
    {
        if (string.IsNullOrWhiteSpace(customerReference))
        {
            return;
        }

        var queueNumber = customerReference.Trim().ToUpperInvariant();
        var message = new[]
        {
            new NativeUserMessage
            {
                flag = PrintStyleBold | PrintStyleCenter,
                len = (ushort)Math.Min(ushort.MaxValue, "***SIRA NO***".Length),
                message = "***SIRA NO***"
            },
            new NativeUserMessage
            {
                flag = PrintStyleHuge | PrintStyleBold | PrintStyleCenter,
                len = (ushort)Math.Min(ushort.MaxValue, queueNumber.Length),
                message = queueNumber
            }
        };

        var userOut = new byte[BufferSize];
        var ticketOut = new byte[BufferSize];
        var retcode = NativeMethods.Json_FP3_PrintUserMessage(
            interfaceHandle,
            transactionHandle,
            ToJsonBytes(message),
            userOut,
            userOut.Length,
            (ushort)message.Length,
            ticketOut,
            ticketOut.Length,
            settings.DefaultTimeoutMs);

        ExecuteAndEnsure(retcode, "Sira numarasi fis uzerine yazdirilamadi");
    }

    private void CleanupReservedTransactions(uint interfaceHandle)
    {
        try
        {
            ushort totalHandles = 0;
            ushort receivedHandles = 0;
            var handleOut = new byte[BufferSize];
            var retcode = NativeMethods.Json_FP3_FunctionGetHandleList(
                interfaceHandle,
                handleOut,
                handleOut.Length,
                TransactionStatusReserved,
                0,
                32,
                ref totalHandles,
                ref receivedHandles,
                settings.DefaultTimeoutMs);

            if (retcode != TransactionResultOk || receivedHandles == 0)
            {
                return;
            }

            var handles = JsonSerializer.Deserialize<NativeHandleList[]>(ReadJson(handleOut), JsonOptions) ?? Array.Empty<NativeHandleList>();
            foreach (var handle in handles)
            {
                if (handle.Handle != 0)
                {
                    TryRecoverTransaction(interfaceHandle, handle.Handle);
                }
            }
        }
        catch
        {
        }
    }

    private void TryRecoverTransaction(uint interfaceHandle, ulong transactionHandle)
    {
        if (transactionHandle == 0)
        {
            return;
        }

        try
        {
            var ticketOut = new byte[BufferSize];
            _ = NativeMethods.Json_FP3_VoidAll(interfaceHandle, transactionHandle, ticketOut, ticketOut.Length, settings.CardTimeoutMs);
        }
        catch
        {
        }

        TryClose(interfaceHandle, transactionHandle);
    }

    private NativeClose CloseTransaction(uint interfaceHandle, ulong transactionHandle)
    {
        var closeOut = new byte[BufferSize];
        var retcode = NativeMethods.Json_FP3_Close(interfaceHandle, transactionHandle, closeOut, closeOut.Length, settings.DefaultTimeoutMs);
        ExecuteAndEnsure(retcode, "Islem kapatilamadi");
        return JsonSerializer.Deserialize<NativeClose>(ReadJson(closeOut), JsonOptions) ?? new NativeClose();
    }

    private void TryClose(uint interfaceHandle, ulong transactionHandle)
    {
        try
        {
            var closeOut = new byte[BufferSize];
            _ = NativeMethods.Json_FP3_Close(interfaceHandle, transactionHandle, closeOut, closeOut.Length, settings.DefaultTimeoutMs);
        }
        catch
        {
        }
    }

    private uint BuildPaymentFlags()
    {
        uint flags = 0;

        if (settings.EnableDigitalMerchantCopy)
        {
            flags |= BankTranFlagSoftCopySupportForMerchantCopy;
        }

        if (settings.BlockManualPanEntry)
        {
            flags |= BankTranFlagManualPanEntryNotAllowed;
        }

        return flags;
    }

    private void ExecuteAndEnsure(uint retcode, string fallbackMessage)
    {
        if (retcode == TransactionResultOk)
        {
            return;
        }

        var message = ResolveError(retcode);
        if (string.IsNullOrWhiteSpace(message))
        {
            message = fallbackMessage;
        }

        throw new InvalidOperationException(message);
    }

    private IEnumerable<PaymentItem> GetEffectiveItems(PaymentRequest paymentRequest)
    {
        if (paymentRequest.Items.Count > 0)
        {
            return paymentRequest.Items;
        }

        return
        [
            new PaymentItem
            {
                Name = "Kart Odemesi",
                UnitPrice = paymentRequest.Amount,
                Quantity = 1
            }
        ];
    }

    private static uint ToMinorUnit(decimal amount)
    {
        return (uint)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);
    }

    private static string Trim(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private void ConfigureGmpXml()
    {
        if (!settings.AutoConfigureRuntime)
        {
            return;
        }

        var xmlPath = Path.Combine(runtimeDirectory, "GMP.XML");
        var document = System.Xml.Linq.XDocument.Load(xmlPath);
        var root = document.Element("GMP");
        var dllNode = root?.Element("DLL");
        var logNode = root?.Element("LOG");
        var interfaceNode = root?.Element("INTERFACE");
        if (dllNode is null || logNode is null || interfaceNode is null)
        {
            throw new IngenicoUnavailableException("GMP.XML yapisi okunamadi.");
        }

        SetValue(dllNode, "LogFileSize", settings.LogFileSizeBytes.ToString(CultureInfo.InvariantCulture));
        SetValue(logNode, "LogThreadOpen", settings.LogThreadOpen ? "TRUE" : "FALSE");
        SetValue(interfaceNode, "RetryCounter", settings.RetryCounter.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "IpRetryCount", settings.IpRetryCount.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "AckTimeOut", settings.AckTimeoutMs.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "CommTimeOut", settings.CommTimeoutMs.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "InterCharacterTimeOut", settings.InterCharacterTimeoutMs.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "PortName", settings.PortName);
        SetValue(interfaceNode, "BaudRate", settings.BaudRate.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "ByteSize", settings.ByteSize.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "Parity", settings.Parity.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "StopBit", settings.StopBit.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "IsTcpConnection", IsTcpConnection() ? "TRUE" : "FALSE");
        SetValue(interfaceNode, "IP", settings.IpAddress);
        SetValue(interfaceNode, "Port", settings.Port.ToString(CultureInfo.InvariantCulture));
        SetValue(interfaceNode, "IsTcpKeepAlive", settings.IsTcpKeepAlive ? "TRUE" : "FALSE");

        document.Save(xmlPath);
    }

    private static void SetValue(System.Xml.Linq.XElement parent, string name, string value)
    {
        var element = parent.Element(name);
        if (element is null)
        {
            parent.Add(new System.Xml.Linq.XElement(name, value));
            return;
        }

        element.Value = value;
    }

    private bool IsTcpConnection()
    {
        return settings.ConnectionMode.Equals("tcp", StringComparison.OrdinalIgnoreCase);
    }

    private WorkerResponse Success(string message)
    {
        return new WorkerResponse
        {
            IsSuccess = true,
            Operation = "test",
            IsReady = true,
            Message = message
        };
    }

    private WorkerResponse Failure(string message, string operation = "test")
    {
        return new WorkerResponse
        {
            IsSuccess = false,
            Operation = operation,
            IsReady = false,
            Message = message
        };
    }

    private static byte[] ToJsonBytes<T>(T value)
    {
        return ToAnsiBytes(JsonSerializer.Serialize(value, JsonOptions));
    }

    private static byte[] ToAnsiBytes(string value)
    {
        return Encoding.GetEncoding(1254).GetBytes(value + '\0');
    }

    private static string ReadJson(byte[] buffer)
    {
        var terminatorIndex = Array.IndexOf(buffer, (byte)0);
        var length = terminatorIndex >= 0 ? terminatorIndex : buffer.Length;
        return Encoding.UTF8.GetString(buffer, 0, length);
    }

    private static string ReadAnsi(byte[] buffer)
    {
        var terminatorIndex = Array.IndexOf(buffer, (byte)0);
        var length = terminatorIndex >= 0 ? terminatorIndex : buffer.Length;
        return Encoding.GetEncoding(1254).GetString(buffer, 0, length);
    }

    private sealed class NativeInterfaceXmlData
    {
        public byte RetryCounter { get; set; }
        public byte IpRetryCount { get; set; }
        public uint AckTimeOut { get; set; }
        public uint CommTimeOut { get; set; }
        public uint InterCharacterTimeOut { get; set; }
        public string PortName { get; set; } = string.Empty;
        public int BaudRate { get; set; }
        public int ByteSize { get; set; }
        public int fParity { get; set; }
        public int Parity { get; set; }
        public int StopBit { get; set; }
        public byte IsTcpConnection { get; set; }
        public string IP { get; set; } = string.Empty;
        public int Port { get; set; }
        public byte IsTcpKeepAlive { get; set; }
    }

    private sealed class NativeItem
    {
        public byte type { get; set; }
        public byte subType { get; set; }
        public byte deptIndex { get; set; }
        public byte unitType { get; set; }
        public uint amount { get; set; }
        public ushort currency { get; set; }
        public uint count { get; set; }
        public uint flag { get; set; }
        public byte countPrecition { get; set; }
        public byte pluPriceIndex { get; set; }
        public string name { get; set; } = string.Empty;
        public string barcode { get; set; } = string.Empty;
        public string firm { get; set; } = string.Empty;
        public string invoiceNo { get; set; } = string.Empty;
        public string subscriberId { get; set; } = string.Empty;
        public string tckno { get; set; } = string.Empty;
        public uint Reserved { get; set; }
        public string szDate { get; set; } = string.Empty;
        public NativePromotion promotion { get; set; } = new();
        public uint OnlineInvoiceItemExceptionCode { get; set; }
    }

    private sealed class NativePromotion
    {
        public uint type { get; set; }
        public uint totalAmount { get; set; }
        public ushort currency { get; set; }
        public uint percentage { get; set; }
        public string promotionInfo { get; set; } = string.Empty;
    }

    private sealed class NativePaymentRequest
    {
        public ulong typeOfPayment { get; set; }
        public uint subtypeOfPayment { get; set; }
        public uint payAmount { get; set; }
        public uint payAmountBonus { get; set; }
        public ushort payAmountCurrencyCode { get; set; }
        public uint bankBkmId { get; set; }
        public uint numberOfinstallments { get; set; }
        public byte[] terminalId { get; set; } = [];
        public string BankPaymentUniqueId { get; set; } = string.Empty;
        public NativeOriginalPaymentData OrgTransData { get; set; } = new();
        public uint batchNo { get; set; }
        public uint stanNo { get; set; }
        public uint rawDataLen { get; set; }
        public byte[] rawData { get; set; } = [];
        public string paymentName { get; set; } = string.Empty;
        public string paymentInfo { get; set; } = string.Empty;
        public uint transactionFlag { get; set; }
        public uint flags { get; set; }
        public string LoyaltyCustomerId { get; set; } = string.Empty;
        public string PaymentProvisionId { get; set; } = string.Empty;
        public uint LoyaltyServiceId { get; set; }
        public uint AllowedInput { get; set; }
    }

    private sealed class NativeOriginalPaymentData
    {
        public string rrn { get; set; } = string.Empty;
        public string authCode { get; set; } = string.Empty;
        public string stan { get; set; } = string.Empty;
        public string terminalId { get; set; } = string.Empty;
        public string maskedPan { get; set; } = string.Empty;
        public string bankLabel { get; set; } = string.Empty;
    }

    private sealed class NativeUserMessage
    {
        public uint flag { get; set; }
        public ushort len { get; set; }
        public string message { get; set; } = string.Empty;
    }

    private sealed class NativeHandleList
    {
        public ulong Handle { get; set; }
    }

    private sealed class NativeClose
    {
        public uint ZNo { get; set; }
        public uint FisNo { get; set; }
    }

    private static class NativeMethods
    {
        [DllImport("GmpSmartDLL.dll", EntryPoint = "GetErrorTurkishDescription", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern void GetErrorTurkishDescription(uint errorCode, byte[] buffer);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_CreateInterface", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_CreateInterface(ref uint interfaceHandle, byte[] interfaceId, byte isDefault, byte[] jsonXmlData);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_UpdateInterfaceXmlDataByID", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_UpdateInterfaceXmlDataByID(byte[] interfaceId, byte[] jsonXmlData);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_CloseInterfaceByID", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_CloseInterfaceByID(byte[] interfaceId);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_GetInterfaceHandleByID", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_GetInterfaceHandleByID(ref uint interfaceHandle, byte[] interfaceId);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_Echo", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_Echo(uint interfaceHandle, byte[] echoOut, int echoOutLength, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_IsGmpPairingDone", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_IsGmpPairingDone(uint interfaceHandle);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_StartPairingInit", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_StartPairingInit(uint interfaceHandle, byte[] pairingIn, byte[] pairingOut, int pairingOutLength);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_Start", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_Start(uint interfaceHandle, ref ulong transactionHandle, byte isBackground, byte[] uniqueId, int uniqueIdLength, byte[] uniqueIdSign, int uniqueIdSignLength, byte[] userData, int userDataLength, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_TicketHeader", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_TicketHeader(uint interfaceHandle, ulong transactionHandle, int ticketType, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_OptionFlags", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_OptionFlags(uint interfaceHandle, ulong transactionHandle, ref ulong activeFlags, ulong flagsToSet, ulong flagsToClear, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_ItemSale", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_ItemSale(uint interfaceHandle, ulong transactionHandle, byte[] jsonItem, byte[] jsonItemOut, int jsonItemOutLength, byte[] jsonTicketOut, int jsonTicketOutLength, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_Payment", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_Payment(uint interfaceHandle, ulong transactionHandle, byte[] paymentRequest, byte[] paymentRequestOut, int paymentRequestOutLength, byte[] jsonTicketOut, int jsonTicketOutLength, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_PrintUserMessage", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_PrintUserMessage(uint interfaceHandle, ulong transactionHandle, byte[] jsonUserMessage, byte[] jsonUserMessageOut, int jsonUserMessageOutLength, ushort numberOfMessage, byte[] jsonTicketOut, int jsonTicketOutLength, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_FunctionGetHandleList", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_FunctionGetHandleList(uint interfaceHandle, byte[] jsonHandleListOut, int jsonHandleListOutLength, byte statusFilter, ushort startIndexOfHandle, ushort handleListSize, ref ushort totalNumberOfHandlesInEcr, ref ushort receivedNumberOfHandleInList, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_VoidAll", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_VoidAll(uint interfaceHandle, ulong transactionHandle, byte[] jsonTicketOut, int jsonTicketOutLength, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_PrintTotalsAndPayments", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_PrintTotalsAndPayments(uint interfaceHandle, ulong transactionHandle, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_PrintBeforeMF", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_PrintBeforeMF(uint interfaceHandle, ulong transactionHandle, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "FP3_PrintMF", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint FP3_PrintMF(uint interfaceHandle, ulong transactionHandle, int timeoutInMilliseconds);

        [DllImport("GmpSmartDLL.dll", EntryPoint = "Json_FP3_Close", CharSet = CharSet.Ansi, CallingConvention = CallingConvention.Cdecl)]
        public static extern uint Json_FP3_Close(uint interfaceHandle, ulong transactionHandle, byte[] jsonCloseOut, int jsonCloseOutLength, int timeoutInMilliseconds);
    }
}
