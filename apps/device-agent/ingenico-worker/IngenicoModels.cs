namespace PrintServer.IngenicoWorker;

internal sealed record RuntimeValidationResult(bool IsReady, bool HasRuntimeFiles, string Message);

internal sealed class WorkerRequest
{
    public string Operation { get; set; } = string.Empty;
    public IngenicoSettings? Settings { get; set; }
    public PaymentRequest? PaymentRequest { get; set; }
}

internal sealed class WorkerResponse
{
    public bool IsSuccess { get; set; }
    public string Operation { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? OrderNumber { get; set; }
    public decimal? ReceiptAmount { get; set; }
    public string? CustomerReference { get; set; }
    public bool? IsReady { get; set; }
    public bool? IsPairingRequired { get; set; }
}

internal sealed class IngenicoSettings
{
    public bool Enabled { get; set; }
    public bool AllowMockFallback { get; set; }
    public string InterfaceId { get; set; } = "PRINTSERVER01";
    public string ConnectionMode { get; set; } = "tcp";
    public string IpAddress { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 7500;
    public string PortName { get; set; } = @"\\.\COM5";
    public int BaudRate { get; set; } = 115200;
    public int ByteSize { get; set; } = 8;
    public int Parity { get; set; }
    public int StopBit { get; set; }
    public int RetryCounter { get; set; } = 1;
    public int IpRetryCount { get; set; } = 1;
    public int AckTimeoutMs { get; set; } = 700;
    public int CommTimeoutMs { get; set; } = 4000;
    public int InterCharacterTimeoutMs { get; set; } = 100;
    public bool IsTcpKeepAlive { get; set; } = true;
    public bool LogThreadOpen { get; set; } = true;
    public int LogFileSizeBytes { get; set; } = 5_000_000;
    public int DefaultDepartmentIndex { get; set; } = 1;
    public int DefaultCurrencyCode { get; set; } = 949;
    public int EchoTimeoutMs { get; set; } = 700;
    public int DefaultTimeoutMs { get; set; } = 5000;
    public int CardTimeoutMs { get; set; } = 100000;
    public bool UseEchoHealthCheck { get; set; }
    public bool EnableDigitalMerchantCopy { get; set; } = true;
    public bool BlockManualPanEntry { get; set; } = true;
    public string WorkerExecutablePath { get; set; } = string.Empty;
    public string RuntimeDirectory { get; set; } = string.Empty;
    public bool AutoConfigureRuntime { get; set; } = true;
}

internal sealed class PaymentRequest
{
    public decimal Amount { get; set; }
    public string CustomerReference { get; set; } = string.Empty;
    public List<PaymentItem> Items { get; set; } = [];
}

internal sealed class PaymentItem
{
    public string Name { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}
