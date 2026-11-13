import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const directory = new URL('../apps/web/public/teamgym-data-entry/references/', import.meta.url);
const write = process.argv.includes('--write');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { aiReferenceData } = await server.ssrLoadModule('/scripts/ai-reference-data.ts');
  const { structure, catalog } = aiReferenceData();
  const version = structure.schemaVersion;
  for (const [name, data] of Object.entries({ [`structure-v${version}.json`]: structure, [`catalog-v${version}.json`]: catalog })) {
    const path = new URL(name, directory);
    const expected = `${JSON.stringify(data, null, 2)}\n`;
    if (write) {
      mkdirSync(fileURLToPath(directory), { recursive: true });
      writeFileSync(path, expected);
    } else if (readFileSync(path, 'utf8') !== expected) {
      throw new Error(`${name} svarer ikke til de installerede kilder. Kør generatoren og gennemgå skillen.`);
    }
  }
} finally {
  await server.close();
}
