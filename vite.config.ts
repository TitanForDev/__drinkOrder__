import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // 當在 GitHub Actions 中建置時，使用 '/__drinkOrder__/' 作為 Base Path 以匹配 GitHub Pages 專案路徑
    base: process.env.GITHUB_ACTIONS ? '/__drinkOrder__/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
