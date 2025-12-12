import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SecureStorage } from './storage';
import { CryptoService } from './crypto';
import { CloudConfig } from '../types';

// Chaves para armazenamento das credenciais
const CLOUD_URL_KEY = 'teogestor_cloud_url';
const CLOUD_KEY_KEY = 'teogestor_cloud_key';
const CLOUD_PASS_KEY = 'teogestor_cloud_pass'; // Senha de criptografia local
const TABLE_NAME = 'evento'; // NOME DA TABELA CENTRALIZADO

let supabase: SupabaseClient | null = null;
let encryptionPassword = '';

// Helper para limpar e corrigir URL de forma agressiva
const cleanUrl = (url: string) => {
    if (!url) return '';
    // 1. Remove espaços e caracteres invisíveis
    let cleaned = url.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // 2. Remove duplicidade de protocolo (ex: https://https://...)
    if (cleaned.match(/^https?:\/\/https?:\/\//)) {
        cleaned = cleaned.replace(/^https?:\/\//, '');
    }

    // 3. CASO: Usuário colou a URL do Dashboard
    const dashboardMatch = cleaned.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/);
    if (dashboardMatch && dashboardMatch[1]) {
        return `https://${dashboardMatch[1]}.supabase.co`;
    }

    // 4. CASO: Usuário colou apenas o Project ID
    if (/^[a-z0-9]{20}$/.test(cleaned)) {
        return `https://${cleaned}.supabase.co`;
    }

    // 5. Garante HTTPS
    if (!cleaned.startsWith('http')) {
        cleaned = `https://${cleaned}`;
    }
    
    // 6. Remove barra final
    if (cleaned.endsWith('/')) {
        cleaned = cleaned.slice(0, -1);
    }
    
    return cleaned;
};

// Timeout promise wrapper
// FIX: Alterado para usar .then(resolve, reject) que é compatível com PromiseLike (Supabase Builder)
const withTimeout = <T>(promise: PromiseLike<T>, ms: number, errorMessage: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (reason) => {
                clearTimeout(timer);
                reject(reason);
            }
        );
    });
};

export const CloudService = {
  // Inicializa o cliente se as credenciais existirem
  init: (): boolean => {
    let url = SecureStorage.getItem(CLOUD_URL_KEY, '');
    let key = SecureStorage.getItem(CLOUD_KEY_KEY, '');
    encryptionPassword = SecureStorage.getItem(CLOUD_PASS_KEY, '');

    // Limpeza de segurança
    url = cleanUrl(url);
    key = key.trim();

    if (url && key) {
      try {
        supabase = createClient(url, key, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            global: {
                headers: { 'x-application-name': 'teogestor' }
            }
        });
        return true;
      } catch (e) {
        console.error("Erro ao iniciar Supabase", e);
        return false;
      }
    }
    return false;
  },

  // Salva credenciais e conecta
  configure: (url: string, key: string, pass: string): boolean => {
    if (!url || !key) return false;
    
    const cleanUrlStr = cleanUrl(url);
    const cleanKeyStr = key.trim();
    const cleanPassStr = pass.trim();

    SecureStorage.setItem(CLOUD_URL_KEY, cleanUrlStr);
    SecureStorage.setItem(CLOUD_KEY_KEY, cleanKeyStr);
    SecureStorage.setItem(CLOUD_PASS_KEY, cleanPassStr);
    
    encryptionPassword = cleanPassStr;
    return CloudService.init();
  },

  disconnect: () => {
    SecureStorage.setItem(CLOUD_URL_KEY, '');
    SecureStorage.setItem(CLOUD_KEY_KEY, '');
    SecureStorage.setItem(CLOUD_PASS_KEY, '');
    supabase = null;
    encryptionPassword = '';
  },

  getConfig: (): CloudConfig | null => {
    const url = SecureStorage.getItem(CLOUD_URL_KEY, '');
    const key = SecureStorage.getItem(CLOUD_KEY_KEY, '');
    const pass = SecureStorage.getItem(CLOUD_PASS_KEY, '');
    return url && key ? { url, key, encryptionPass: pass } : null;
  },

  // --- CRUD Operations ---
  
  // Teste de conexão real com Timeout
  testConnection: async () => {
    if (!supabase) return { success: false, error: 'Cliente não inicializado' };
    try {
        // Timeout de 10s para não travar a interface se o projeto estiver pausado/offline
        const { error } = await withTimeout(
            supabase.from(TABLE_NAME).select('id').limit(1),
            10000,
            'Tempo limite excedido. O projeto Supabase pode estar PAUSADO.'
        );
        
        if (error) {
            if (error.code === '42P01') { 
                return { success: false, error: 'A tabela "evento" não existe. Use o botão "Script SQL" na configuração.' };
            }
            return { success: false, error: `Erro Supabase: ${error.message} (${error.code})` };
        }
        return { success: true };
    } catch (e: any) {
        const msg = e.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('Load failed')) {
             return { success: false, error: 'Falha de rede. Verifique a URL ou se o projeto Supabase foi pausado (Free Tier).' };
        }
        if (msg.includes('PAUSADO')) {
            return { success: false, error: 'O projeto Supabase parece estar PAUSADO. Acesse supabase.com para reativá-lo.' };
        }
        return { success: false, error: e.message || 'Erro desconhecido ao testar conexão' };
    }
  },

  // Salva o estado completo do evento na nuvem (CRIPTOGRAFADO)
  saveEvent: async (eventId: string, data: any) => {
    if (!supabase) return { error: 'Nuvem não conectada' };
    
    try {
      let payload = data;

      // Se tiver senha configurada, criptografa antes de enviar
      if (encryptionPassword) {
         const encrypted = await CryptoService.encryptData(data, encryptionPassword);
         if (!encrypted) throw new Error("Falha na criptografia local");
         // Envolve num objeto para identificar que é criptografado
         payload = { 
            _encrypted: true, 
            content: encrypted 
         };
      }

      const { error } = await withTimeout(
          supabase
            .from(TABLE_NAME)
            .upsert(
              { 
                id: eventId, 
                data: payload,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'id' }
            ),
          15000,
          'Tempo limite excedido no upload.'
      );
      
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error("Erro no upload Cloud:", e);
      if (e.message && e.message.includes('Failed to fetch')) {
          return { error: 'Erro de conexão (URL inválida ou projeto pausado).' };
      }
      return { error: e.message || 'Erro de conexão' };
    }
  },

  // Baixa o evento da nuvem (E DESCRIPTOGRAFA)
  loadEvent: async (eventId: string) => {
    if (!supabase) return { error: 'Nuvem não conectada' };

    try {
      const { data, error } = await withTimeout(
          supabase
            .from(TABLE_NAME)
            .select('data, updated_at')
            .eq('id', eventId)
            .single(),
          10000,
          'Tempo limite excedido no download.'
      );

      if (error) {
         if (error.code === 'PGRST116') return { data: null };
         throw error;
      }

      let finalData = data?.data;

      // Verifica se o dado baixado está criptografado
      if (finalData && finalData._encrypted && finalData.content) {
         if (!encryptionPassword) {
            return { error: 'Dados criptografados. Configure a Senha de Criptografia.' };
         }
         
         const decrypted = await CryptoService.decryptData(finalData.content, encryptionPassword);
         
         if (decrypted && decrypted.error) {
            return { error: 'Senha de criptografia incorreta.' };
         }
         
         if (!decrypted) {
            return { error: 'Falha fatal na descriptografia.' };
         }
         
         finalData = decrypted;
      }

      return { data: finalData, updatedAt: data?.updated_at };
    } catch (e: any) {
      console.error("Erro no download Cloud:", e);
      if (e.message && e.message.includes('Failed to fetch')) {
          return { error: 'Erro de conexão (URL inválida ou projeto pausado).' };
      }
      return { error: e.message || 'Erro de conexão' };
    }
  },

  // Lista todos os eventos para o provedor master
  listAllEvents: async () => {
    if (!supabase) return { error: 'Nuvem não conectada' };

    try {
      const { data, error } = await withTimeout(
          supabase
            .from(TABLE_NAME)
            .select('id, updated_at')
            .order('updated_at', { ascending: false }),
          8000, // 8s timeout para listagem
          'Timeout'
      );

      if (error) throw error;
      return { data };
    } catch (e: any) {
      console.error("Erro ao listar eventos:", e);
      if (e.message && (e.message.includes('Failed to fetch') || e.message === 'Timeout')) {
          return { error: 'Falha de conexão. Projeto Supabase pausado ou URL incorreta.' };
      }
      return { error: e.message || 'Erro de conexão' };
    }
  },
};