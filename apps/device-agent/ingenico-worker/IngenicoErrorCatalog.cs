using System.Text.RegularExpressions;

namespace PrintServer.IngenicoWorker;

internal sealed class IngenicoErrorCatalog
{
    private static readonly Regex ErrorLineRegex = new(@"=\s*(\d+),.*?returns\s+""([^""]+)""", RegexOptions.Compiled);
    private readonly Dictionary<uint, string> errors = new();

    public IngenicoErrorCatalog(string runtimeDirectory)
    {
        var candidatePaths = new[]
        {
            Path.Combine(runtimeDirectory, "GMP3Mesajlar.txt"),
            Path.Combine(AppContext.BaseDirectory, "GMP3Mesajlar.txt"),
        };

        var catalogPath = candidatePaths.FirstOrDefault(File.Exists);
        if (string.IsNullOrWhiteSpace(catalogPath))
        {
            return;
        }

        foreach (var line in File.ReadLines(catalogPath))
        {
            var match = ErrorLineRegex.Match(line);
            if (!match.Success)
            {
                continue;
            }

            if (uint.TryParse(match.Groups[1].Value, out var code))
            {
                errors[code] = match.Groups[2].Value.Trim();
            }
        }
    }

    public string? GetMessage(uint errorCode)
    {
        return errors.TryGetValue(errorCode, out var value) ? value : null;
    }
}
