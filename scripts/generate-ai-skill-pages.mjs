import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const root = new URL('../apps/web/public/teamgym-data-entry/', import.meta.url);
const pages = [
  { source: 'SKILL.md', output: 'index.html', label: 'Overblik' },
  { source: 'references/format.md', output: 'references/format.html', label: 'Filformat' },
  { source: 'references/registration.md', output: 'references/registration.html', label: 'Registrering' },
  { source: 'references/scenarios.md', output: 'references/scenarios.html', label: 'Scenarier' },
  { source: 'references/drive.md', output: 'references/drive.html', label: 'Gemning' },
  { source: 'references/source-map-v7.md', output: 'references/source-map-v7.html', label: 'Kilder' },
];

const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const markdown = new Marked({
  gfm: true,
  walkTokens(token) {
    if (token.type === 'link' && /^\.?\.?\/?[\w/.-]+\.md$/.test(token.href))
      token.href = token.href.replace(/\.md$/, '.html');
  },
  renderer: {
    html({ text }) { return escapeHtml(text); },
  },
});

function renderPage(page) {
  const raw = readFileSync(new URL(page.source, root), 'utf8');
  const source = page.source === 'SKILL.md' ? raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '') : raw;
  const title = source.match(/^# (.+)$/m)?.[1];
  if (!title) throw new Error(`Mangler overskrift i ${page.source}`);
  const content = markdown.parse(source);
  if (typeof content !== 'string') throw new Error(`Uventet asynkron Markdown i ${page.source}`);
  const inReferences = page.output.startsWith('references/');
  const prefix = inReferences ? '../' : '';
  const nav = pages.map((item) => {
    const href = `${prefix}${item.output}`;
    return `<a href="${href}"${item.output === page.output ? ' aria-current="page"' : ''}>${item.label}</a>`;
  }).join('\n');
  const sourceHref = page.source.split('/').at(-1);
  const appHref = inReferences ? '../../' : '../';
  return `<!doctype html>
<html lang="da">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)} · TeamGym</title>
  <link rel="stylesheet" href="${prefix}reader.css">
</head>
<body>
  <a class="skip-link" href="#indhold">Gå til indhold</a>
  <header class="site-header">
    <div class="site-header-inner">
      <div class="brand"><span class="brand-mark" aria-hidden="true">T</span><span>TeamGym <small>Inddata med AI</small></span></div>
      <a class="app-link" href="${appHref}">Tilbage til appen <span aria-hidden="true">↗</span></a>
    </div>
  </header>
  <div class="reader-layout">
    <nav class="reader-nav" aria-label="Vejledningens afsnit">${nav}</nav>
    <main id="indhold" class="reader-content">
      <div class="eyebrow">TeamGym · agentvejledning</div>
      <article class="prose">${content}</article>
      <footer class="reader-footer"><span>Agentens kildefil</span><a href="${sourceHref}">Åbn rå Markdown</a></footer>
    </main>
  </div>
</body>
</html>
`;
}

const write = process.argv.includes('--write');
for (const page of pages) {
  const target = new URL(page.output, root);
  const expected = renderPage(page);
  if (write) writeFileSync(target, expected);
  else if (readFileSync(target, 'utf8') !== expected)
    throw new Error(`${fileURLToPath(target)} er forældet. Kør node scripts/generate-ai-skill-pages.mjs --write`);
}
