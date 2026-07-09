export const CryptoService = {
  // Generate a new AES-GCM encryption key
  generateKey: async () => {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  },

  // Encrypt a string message
  encryptMessage: async (key, message) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoded
    );
    
    // Combine IV and Ciphertext for transmission
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  },

  // Decrypt a base64 encrypted message
  decryptMessage: async (key, encryptedBase64) => {
    try {
      const combined = new Uint8Array(
        atob(encryptedBase64).split("").map(c => c.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (e) {
      console.error("Decryption failed:", e);
      return "[Encrypted Message - Unable to decrypt]";
    }
  }
};
