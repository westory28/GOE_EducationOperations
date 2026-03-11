import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: isGitHubPagesBuild ? '/GOE_EducationOperations/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
