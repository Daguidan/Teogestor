import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseado no modo (development/production)
  // O terceiro argumento '' garante que carregue todas as vars, não apenas as com prefixo VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Isso substitui "process.env.API_KEY" pelo valor real da variável durante o build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Mantém um objeto vazio para outras chamadas genéricas de process.env para evitar erros
      'process.env': {}
    },
    server: {
      watch: {
        ignored: ['**/node_modules/**']
      }
    },
    optimizeDeps: {
      include: ['@supabase/supabase-js']
    }
  };
});