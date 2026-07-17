using System.Text.RegularExpressions;

namespace backend;

public static class Validation
{
    private static readonly Regex SlugRegex = new("^[a-z0-9]+(-[a-z0-9]+)*$", RegexOptions.Compiled);

    public static bool IsValidSlug(string id) => !string.IsNullOrWhiteSpace(id) && SlugRegex.IsMatch(id);

    private static readonly int[] CuitWeights = { 5, 4, 3, 2, 7, 6, 5, 4, 3, 2 };

    public static bool IsValidCuit(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;

        var digits = new string(value.Where(char.IsDigit).ToArray());
        if (digits.Length != 11) return false;

        var sum = 0;
        for (var i = 0; i < 10; i++)
            sum += (digits[i] - '0') * CuitWeights[i];

        var mod = 11 - (sum % 11);
        var checkDigit = mod == 11 ? 0 : mod == 10 ? 9 : mod;
        return checkDigit == digits[10] - '0';
    }
}
