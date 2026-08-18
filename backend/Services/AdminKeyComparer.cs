using System.Security.Cryptography;
using System.Text;

namespace backend.Services;

// Comparación de la X-Admin-Key compartida por los 3 puntos del código que la
// necesitan (el filtro global y los dos IsAdmin() ad hoc de Products/Categories).
// Timing-safe, y falla cerrado si no hay clave configurada.
public static class AdminKeyComparer
{
    public static bool Matches(string? provided, string? configuredKey)
    {
        if (string.IsNullOrEmpty(configuredKey)) return false;

        var providedBytes = Encoding.UTF8.GetBytes(provided ?? "");
        var configuredBytes = Encoding.UTF8.GetBytes(configuredKey);

        if (providedBytes.Length != configuredBytes.Length) return false;
        return CryptographicOperations.FixedTimeEquals(providedBytes, configuredBytes);
    }
}
