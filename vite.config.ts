import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const reference = new URL('./openspec/changes/build-teamgym-team-manager/reference/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('source-manifest.json', reference), 'utf8')) as {
  sources: { file: string }[];
};

export default defineConfig({
  base: '/teamgym-team-manager/',
  plugins: [
    react(),
    {
      name: 'locked-rule-sources',
      generateBundle() {
        for (const source of manifest.sources)
          this.emitFile({
            type: 'asset',
            fileName: `sources/${source.file.split('/').at(-1)}`,
            source: readFileSync(new URL(source.file, reference)),
          });
      },
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const name = request.url?.split('?')[0]?.split('/').at(-1);
          const source =
            request.url?.includes('/sources/') &&
            manifest.sources.find((source) => source.file.split('/').at(-1) === name);
          if (!source) {
            next();
            return;
          }
          response.setHeader('Content-Type', 'application/pdf');
          response.end(readFileSync(new URL(source.file, reference)));
        });
      },
    },
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        t01: fileURLToPath(new URL('./tools/t01/index.html', import.meta.url)),
      },
    },
  },
});
