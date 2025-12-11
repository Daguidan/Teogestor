import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseado no modo (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Substituição segura das variáveis específicas
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Fallback seguro que não quebra bibliotecas que dependem de process.env
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