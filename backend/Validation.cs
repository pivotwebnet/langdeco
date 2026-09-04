using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace backend;

public static class Validation
{
    private static readonly Regex SlugRegex = new("^[a-z0-9]+(-[a-z0-9]+)*$", RegexOptions.Compiled);
    private static readonly Regex NonSlugChars = new("[^a-z0-9]+", RegexOptions.Compiled);

    public static bool IsValidSlug(string id) => !string.IsNullOrWhiteSpace(id) && SlugRegex.IsMatch(id);

    // Deriva un slug válido (ver IsValidSlug) a partir de un nombre libre — usado por la
    // importación masiva de productos, donde el Excel no trae un id/slug propio.
    public static string Slugify(string name)
    {
        var normalized = name.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            sb.Append(c);
        }

        var slug = NonSlugChars.Replace(sb.ToString().ToLowerInvariant(), "-").Trim('-');
        return slug.Length == 0 ? "producto" : slug;
    }

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
