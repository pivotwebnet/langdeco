using System.Text.RegularExpressions;

namespace backend;

public static class Validation
{
    private static readonly Regex SlugRegex = new("^[a-z0-9]+(-[a-z0-9]+)*$", RegexOptions.Compiled);

    public static bool IsValidSlug(string id) => !string.IsNullOrWhiteSpace(id) && SlugRegex.IsMatch(id);
}
