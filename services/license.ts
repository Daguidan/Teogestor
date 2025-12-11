

// Serviço de Licenciamento Offline
// Gera um hash único baseado no ID do Circuito + Segredo Mestre

import { LICENSE_SALT, MASTER_LICENSE_KEY } from "../constants";

// Função simples de Hash para gerar códigos curtos
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().substring(0, 6); // Retorna 6 caracteres hex
};

export const generateLicenseKey = (circuitId: string): string => {
  const normalizedId = circuitId.trim().toUpperCase().replace(/\s+/g, '');
  // A chave é baseada no ID + SALT do sistema.
  // Se mudar o SALT em constants, todas as chaves mudam.
  const rawKey = simpleHash(normalizedId + LICENSE_SALT);
  
  // Formata para ficar bonitinho: ABC-123
  return `${rawKey.substring(0, 3)}-${rawKey.substring(3)}`;
};

export const validateLicenseKey = (circuitId: string, inputKey: string): boolean => {
  const normalizedInput = inputKey.trim().toUpperCase();
  
  // Backdoor: Se for a chave mestra, libera sempre
  if (normalizedInput === MASTER_LICENSE_KEY) {
    return true;
  }

  const validKey = generateLicenseKey(circuitId);
  
  // Dica para desenvolvedor: Logar a chave correta no console para testes
  // Usando import.meta.env.DEV que é o padrão do Vite para ambiente de desenvolvimento
  if ((import.meta as any).env?.DEV) {
    console.log(`[DEV] Chave correta para ${circuitId}: ${validKey}`);
  }

  return validKey === normalizedInput;
};