namespace backend.Tests;

public class ValidationTests
{
    [Theory]
    [InlineData("Mesa Ratona", "mesa-ratona")]
    [InlineData("Botellón López", "botellon-lopez")]
    [InlineData("  Silla   Nórdica  ", "silla-nordica")]
    [InlineData("Copas x6 (Set)", "copas-x6-set")]
    [InlineData("---", "producto")]
    [InlineData("", "producto")]
    public void Slugify_ProducesValidSlugs(string input, string expected)
    {
        var slug = Validation.Slugify(input);

        Assert.Equal(expected, slug);
        Assert.True(Validation.IsValidSlug(slug));
    }
}
