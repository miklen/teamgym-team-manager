// Skriver tmp/fundamentkatalog.md til lokal gennemgang. Indholdet afledes af appens kode.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
});
try {
  const { foundationReport } = await server.ssrLoadModule('/apps/web/src/foundation-report.ts');
  const { DK_V1 } = await server.ssrLoadModule('@teamgym/rules');
  const target = new URL('../tmp/fundamentkatalog.md', import.meta.url);
  await mkdir(new URL('.', target), { recursive: true });
  await writeFile(target, foundationReport(DK_V1));
  console.log(`Skrev ${fileURLToPath(target)}`);
} finally {
  await server.close();
}
