
// Serviço de Criptografia AES-GCM usando Web Crypto API nativa
// Garante que os dados sejam ilegíveis no servidor (Supabase/Firebase)

const ALGORITHM = 'AES-GCM';
const HASH_ALGORITHM = 'SHA-256';
const PBKDF2_ITERATIONS = 100000; // Alto número de iterações para evitar força bruta

// Converte string para ArrayBuffer
const str2ab = (str: string): Uint8Array => new TextEncoder().encode(str);

// Gera uma chave criptográfica a partir da senha do usuário
const getKeyMaterial = (password: string): Promise<CryptoKey> => {
  return window.crypto.subtle.importKey(
    "raw",
    str2ab(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
};

const getKey = (keyMaterial: CryptoKey, salt: Uint8Array): Promise<CryptoKey> => {
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const CryptoService = {
  // Criptografa um objeto JSON usando uma senha
  encryptData: async (data: any, password: string): Promise<string | null> => {
    try {
      if (!password) return null;
      
      const jsonString = JSON.stringify(data);
      const salt = window.crypto.getRandomValues(new Uint8Array(16)); // Salt aleatório
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV aleatório

      const keyMaterial = await getKeyMaterial(password);
      const key = await getKey(keyMaterial, salt);

      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv },
        key,
        str2ab(jsonString)
      );

      // Empacota tudo: Salt + IV + Conteúdo Criptografado em Base64
      // Formato: base64(salt):base64(iv):base64(content)
      const encryptedArray = new Uint8Array(encryptedContent);
      
      const buff_to_base64 = (buff: Uint8Array) => btoa(String.fromCharCode.apply(null, Array.from(buff)));

      return `${buff_to_base64(salt)}:${buff_to_base64(iv)}:${buff_to_base64(encryptedArray)}`;
    } catch (e) {
      console.error("Erro na criptografia:", e);
      return null;
    }
  },

  // Descriptografa a string Base64 de volta para o objeto original
  decryptData: async (encryptedBundle: string, password: string): Promise<any | null> => {
    try {
      if (!password || !encryptedBundle) return null;

      const parts = encryptedBundle.split(':');
      if (parts.length !== 3) {
        throw new Error("Formato de dados inválido");
      }

      const base64_to_buff = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

      const salt = base64_to_buff(parts[0]);
      const iv = base64_to_buff(parts[1]);
      const encryptedData = base64_to_buff(parts[2]);

      const keyMaterial = await getKeyMaterial(password);
      const key = await getKey(keyMaterial, salt);

      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv },
        key,
        encryptedData
      );

      const decodedString = new TextDecoder().decode(decryptedContent);
      return JSON.parse(decodedString);
    } catch (e) {
      console.error("Erro na descriptografia (senha incorreta?):", e);
      return { error: 'Falha ao descriptografar. Verifique a senha.' };
    }
  }
};
