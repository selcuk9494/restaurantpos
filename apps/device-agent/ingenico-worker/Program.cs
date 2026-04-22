using System.Text.Json;
using PrintServer.IngenicoWorker;

var jsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = true
};

if (args.Length != 3 || !string.Equals(args[0], "--ingenico-worker", StringComparison.OrdinalIgnoreCase))
{
    Console.Error.WriteLine("Usage: IngenicoWorker --ingenico-worker <request.json> <response.json>");
    return 1;
}

var requestPath = args[1];
var responsePath = args[2];

try
{
    var requestJson = await File.ReadAllTextAsync(requestPath);
    var request = JsonSerializer.Deserialize<WorkerRequest>(requestJson, jsonOptions) ?? new WorkerRequest();
    var response = await HandleRequestAsync(request);
    await File.WriteAllTextAsync(responsePath, JsonSerializer.Serialize(response, jsonOptions));
    return response.IsSuccess ? 0 : 2;
}
catch (Exception exception)
{
    var failure = new WorkerResponse
    {
        IsSuccess = false,
        Operation = "unknown",
        Message = exception.Message,
        Details = exception.ToString()
    };
    await File.WriteAllTextAsync(responsePath, JsonSerializer.Serialize(failure, jsonOptions));
    return 1;
}

static Task<WorkerResponse> HandleRequestAsync(WorkerRequest request)
{
    var settings = request.Settings ?? new IngenicoSettings();
    var runtimeDirectory = ResolveRuntimeDirectory(settings);
    var summary = BuildSummary(settings, runtimeDirectory);
    var validation = ValidateRuntime(settings, runtimeDirectory);
    var nativeService = new IngenicoNativeService(settings, runtimeDirectory);

    if (settings.AutoConfigureRuntime && validation.HasRuntimeFiles)
    {
        // Native service kendi icinde GMP.XML konfigurasyonunu da uygular.
    }

    if (!validation.IsReady)
    {
        return Task.FromResult(new WorkerResponse
        {
            IsSuccess = false,
            Operation = request.Operation,
            Message = validation.Message,
            Details = summary,
            IsReady = false
        });
    }

    WorkerResponse response = request.Operation switch
    {
        "test" => nativeService.TestConnection(),
        "precheck" => nativeService.RunPrecheck(),
        "pairing" => nativeService.StartPairing(),
        "payment" => nativeService.ProcessPayment(request.PaymentRequest),
        "cancel" => nativeService.CancelActivePayment(),
        _ => new WorkerResponse
        {
            IsSuccess = false,
            Operation = request.Operation,
            Message = "Bilinmeyen Ingenico worker islemi.",
            IsReady = validation.IsReady,
        }
    };

    response.Details = string.IsNullOrWhiteSpace(response.Details)
        ? summary
        : $"{response.Details}{Environment.NewLine}{Environment.NewLine}{summary}";

    return Task.FromResult(response);
}

static RuntimeValidationResult ValidateRuntime(IngenicoSettings settings, string runtimeDirectory)
{
    if (!OperatingSystem.IsWindows())
    {
        return new RuntimeValidationResult(false, false, "Ingenico worker yalnizca Windows ortaminda gercek cihazla calisir.");
    }

    if (!settings.Enabled)
    {
        return new RuntimeValidationResult(false, false, "Ingenico ayari kapali. Once etkinlestirin.");
    }

    if (!Directory.Exists(runtimeDirectory))
    {
        return new RuntimeValidationResult(false, false, $"Runtime klasoru bulunamadi: {runtimeDirectory}");
    }

    var dllPath = Path.Combine(runtimeDirectory, "GMPSmartDLL.dll");
    var xmlPath = Path.Combine(runtimeDirectory, "GMP.XML");
    if (!File.Exists(dllPath) || !File.Exists(xmlPath))
    {
        return new RuntimeValidationResult(false, false, "GMPSmartDLL.dll veya GMP.XML bulunamadi.");
    }

    return new RuntimeValidationResult(true, true, "Ingenico runtime hazir.");
}

static string ResolveRuntimeDirectory(IngenicoSettings settings)
{
    if (!string.IsNullOrWhiteSpace(settings.RuntimeDirectory))
    {
        return settings.RuntimeDirectory;
    }

    return Path.Combine(AppContext.BaseDirectory, "ingenico-runtime");
}

static string BuildSummary(IngenicoSettings settings, string runtimeDirectory)
{
    return string.Join(
        Environment.NewLine,
        [
            $"Runtime: {runtimeDirectory}",
            $"Baglanti: {settings.ConnectionMode}",
            $"InterfaceId: {settings.InterfaceId}",
            $"IP: {settings.IpAddress}",
            $"Port: {settings.Port}",
            $"COM: {settings.PortName}",
            $"Timeout: {settings.DefaultTimeoutMs}ms",
            $"Kart Timeout: {settings.CardTimeoutMs}ms"
        ]);
}
