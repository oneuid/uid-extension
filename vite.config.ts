import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

import fs from 'fs';

export default defineConfig({
  build: {
    outDir: process.env.TARGET === 'firefox' ? 'dist/firefox' : 'dist/chrome',
    emptyOutDir: true,
  },
  plugins: [
    webExtension({
      manifest: () => {
        const manifestString = fs.readFileSync('./manifest.json', 'utf-8');
        const manifest = JSON.parse(manifestString);
        
        const target = process.env.TARGET || 'chrome';
        
        if (target === 'firefox') {
          manifest.background = {
            scripts: ["src/background/index.ts"]
          };
        } else {
          manifest.background = {
            service_worker: "src/background/index.ts"
          };
        }
        
        return manifest;
      },
    }),
  ],
});
