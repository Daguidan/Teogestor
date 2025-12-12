import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseado no modo (development/production)
  const env = loadEnv(mode, '.', '');

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
    build: {
      // Otimizações de build para evitar erros de memória no Vercel
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@supabase/supabase-js'],
            ui: ['lucide-react']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['@supabase/supabase-js']
    }
  };
});