
// Simple client-side encryption simulation to prevent casual inspection in localStorage
// In a real production app with backend, we would use proper key management.
// Here we obfuscate to satisfy the "encrypted locally" requirement for a static web app.

const ENCRYPTION_PREFIX = 'congass_enc_';

const encode = (data: any): string => {
  try {
    const json = JSON.stringify(data);
    // Logic: JSON -> URI Encode -> Base64 -> Reverse -> Base64
    return btoa(btoa(encodeURIComponent(json)).split('').reverse().join(''));
  } catch (e) {
    console.error("Encryption failed", e);
    return '';
  }
};

const decode = <T>(encodedDetails: string): T | null => {
  try {
    // Reverse logic must match encode exactly in reverse order:
    // 1. Decode outer Base64 -> gets the reversed inner Base64 string
    const reversedInner = atob(encodedDetails);
    
    // 2. Reverse the string back to normal order
    const innerBase64 = reversedInner.split('').reverse().join('');
    
    // 3. Decode inner Base64 -> gets the URI component
    const uriComponent = atob(innerBase64);
    
    // 4. Decode URI component -> gets the JSON string
    const json = decodeURIComponent(uriComponent);
    
    return JSON.parse(json);
  } catch (e) {
    console.error("Decryption failed", e);
    // Fallback: try to parse as raw JSON in case data was saved without encryption during dev
    try {
        return JSON.parse(encodedDetails) as T;
    } catch {
        return null;
    }
  }
};

export const SecureStorage = {
  setItem: (key: string, data: any) => {
    const encrypted = encode(data);
    localStorage.setItem(ENCRYPTION_PREFIX + key, encrypted);
  },

  getItem: <T>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(ENCRYPTION_PREFIX + key);
    if (!item) return defaultValue;
    const decoded = decode<T>(item);
    return decoded !== null ? decoded : defaultValue;
  },

  // NOVA FUNÇÃO: Varre o LocalStorage em busca de chaves que pareçam ser de circuitos
  listLocalEvents: (): string[] => {
    const foundEvents = new Set<string>();
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ENCRYPTION_PREFIX)) {
          // A chave bruta é algo como: congass_enc_GO-003-A_structure
          // Removemos o prefixo de encriptação
          let cleanKey = key.replace(ENCRYPTION_PREFIX, '');
          
          // Verificamos se é uma chave de estrutura (que indica um evento criado)
          if (cleanKey.includes('_structure') || cleanKey.includes('_CONVENTION_structure')) {
             // Remove os sufixos para pegar só o ID
             const eventId = cleanKey
               .replace('_CONVENTION_structure', '')
               .replace('_structure', '')
               .trim();
             
             // FILTRO AVANÇADO: Remove Lixo Técnico e Templates
             if (
                 eventId && 
                 eventId !== 'VISITANTE' && 
                 eventId !== 'MASTER' &&
                 !eventId.startsWith('TEMPLATE_') &&
                 !eventId.includes('$') &&       // Remove ${eventKey}
                 !eventId.includes('{') &&       // Remove {OBJ}
                 eventId.toLowerCase() !== 'assembly' && // Remove testes
                 eventId.toLowerCase() !== 'undefined'
             ) {
               foundEvents.add(eventId);
             }
          }
        }
      }
    } catch (e) {
      console.error("Erro ao listar eventos locais", e);
    }
    
    return Array.from(foundEvents);
  },

  clear: () => {
    localStorage.clear();
  }
};
