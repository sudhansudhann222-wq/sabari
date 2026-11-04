import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '127.0.0.1',
    fs: {
      deny: ['.env', '.env.*', '.git/**', '**/*.key', '**/*.pem', '**/*.crt', '**/*.p12', '**/*.pfx', '**/*credentials*', '**/*secret*', '**/users.json', '**/accounts.json', '**/.bash_history', '**/.mysql_history', '**/JAMonAdmin.jsp'],
    },
  },
  preview: {
    host: '127.0.0.1',
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
