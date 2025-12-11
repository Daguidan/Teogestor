

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SecureStorage } from './storage';
import { CryptoService } from './crypto';
// FIX: Import CloudConfig from shared types and remove local definition.
import { CloudConfig } from '../types';

// Chaves para armazenamento das credenciais
const CLOUD_URL_KEY = 'teogestor_cloud_url';
const CLOUD_KEY_KEY = 'teogestor_cloud_key';
const CLOUD_PASS_KEY = 'teogestor_cloud_pass'; // Senha de criptografia local
const TABLE_NAME = 'evento'; // NOME DA TABELA CENTRALIZADO (CORRIGIDO PARA SINGULAR)

let supabase: SupabaseClient | null = null;
let encryptionPassword = '';

export const CloudService = {
  // Inicializa o cliente se as credenciais existirem
  init: (): boolean => {
    const url = SecureStorage.getItem(CLOUD_URL_KEY, '');
    const key = SecureStorage.getItem(CLOUD_KEY_KEY, '');
    encryptionPassword = SecureStorage.getItem(CLOUD_PASS_KEY, '');

    if (url && key) {
      try {
        supabase = createClient(url, key);
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
    SecureStorage.setItem(CLOUD_URL_KEY, url);
    SecureStorage.setItem(CLOUD_KEY_KEY, key);
    SecureStorage.setItem(CLOUD_PASS_KEY, pass);
    
    encryptionPassword = pass;
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

      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(
          { 
            id: eventId, 
            data: payload,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error("Erro no upload Cloud:", e);
      return { error: e.message || 'Erro de conexão' };
    }
  },

  // Baixa o evento da nuvem (E DESCRIPTOGRAFA)
  loadEvent: async (eventId: string) => {
    if (!supabase) return { error: 'Nuvem não conectada' };

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('data, updated_at')
        .eq('id', eventId)
        .single();

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
      return { error: e.message || 'Erro de conexão' };
    }
  },

  // NOVA FUNÇÃO: Lista todos os eventos para o provedor master
  listAllEvents: async () => {
    if (!supabase) return { error: 'Nuvem não conectada' };

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { data };
    } catch (e: any) {
      console.error("Erro ao listar eventos:", e);
      return { error: e.message || 'Erro de conexão' };
    }
  },
};