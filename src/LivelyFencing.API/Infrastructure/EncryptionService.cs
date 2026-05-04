using System.Security.Cryptography;
using System.Text;

namespace LivelyFencing.API.Infrastructure;

public static class EncryptionService
{
    // Key is derived from config — 32 bytes for AES-256
    public static (byte[] ciphertext, byte[] iv) Encrypt(string plaintext, string keyBase64)
    {
        using var aes = Aes.Create();
        aes.Key = Convert.FromBase64String(keyBase64);
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var bytes = Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = encryptor.TransformFinalBlock(bytes, 0, bytes.Length);
        return (ciphertext, aes.IV);
    }

    public static string Decrypt(byte[] ciphertext, byte[] iv, string keyBase64)
    {
        using var aes = Aes.Create();
        aes.Key = Convert.FromBase64String(keyBase64);
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor();
        var plainBytes = decryptor.TransformFinalBlock(ciphertext, 0, ciphertext.Length);
        return Encoding.UTF8.GetString(plainBytes);
    }

    public static string MaskTaxId(string taxId) =>
        taxId.Length >= 4 ? "***-**-" + taxId[^4..] : "****";
}
