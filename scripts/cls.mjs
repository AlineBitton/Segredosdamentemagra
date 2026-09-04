/** Identifica exatamente quais elementos deslocam o layout. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = path.resolve(import.meta.dirname, '../dist');
const TIPOS = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.woff2':'font/woff2', '.svg':'image/svg+xml' };
const srv = createServer(async (req, res) => {
  let rel = new URL(req.url, 'http://x').pathname;
  if (rel.endsWith('/')) rel += 'index.html';
  const f = path.join(DIST, rel);
  if (!f.startsWith(DIST) || !existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
});
await new Promise((r) => srv.listen(4323, r));

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const ctx = await nav.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 });
const pg = await ctx.newPage();

await pg.addInitScript(() => {
  window.__shifts = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__shifts.push({
        valor: e.value,
        fontes: (e.sources || []).map((s) => {
          const n = s.node;
          if (!n) return '(sem no)';
          const tag = n.tagName ? n.tagName.toLowerCase() : String(n.nodeName);
          const cls = n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).join('.') : '';
          const txt = (n.textContent || '').trim().slice(0, 45);
          return `${tag}${cls}  «${txt}»`;
        }),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
});

await pg.goto('http://127.0.0.1:4323/', { waitUntil: 'load' });
await pg.waitForTimeout(3500);

const shifts = await pg.evaluate(() => window.__shifts);
const total = shifts.reduce((a, s) => a + s.valor, 0);
console.log(`\n  CLS total observado: ${total.toFixed(4)}  (${shifts.length} deslocamento(s))\n`);
for (const s of shifts.sort((a, b) => b.valor - a.valor)) {
  console.log(`  ${s.valor.toFixed(4)}`);
  s.fontes.forEach((f) => console.log(`      ${f}`));
}
console.log();
await nav.close(); srv.close();
