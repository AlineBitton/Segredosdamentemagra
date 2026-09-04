/** Sobe o dist/ e roda Lighthouse em mobile e desktop. Relatorio em docs/. */
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.avif': 'image/avif', '.webp': 'image/webp',
};

const servidor = createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const arq = path.join(DIST, rel);
  if (!arq.startsWith(DIST) || !existsSync(arq)) { res.writeHead(404).end(); return; }
  const ext = path.extname(arq);
  const corpo = await readFile(arq);
  // comprime texto como a Cloudflare faz, senao a auditoria mede um cenario
  // que a producao nunca vai servir
  const comprimivel = ['.html', '.css', '.js', '.svg'].includes(ext);
  const aceita = (req.headers['accept-encoding'] || '').includes('gzip');
  const saida = comprimivel && aceita ? gzipSync(corpo, { level: 9 }) : corpo;
  res.writeHead(200, {
    'content-type': TIPOS[ext] || 'application/octet-stream',
    'cache-control': ext === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache',
    ...(saida !== corpo ? { 'content-encoding': 'gzip' } : {}),
  });
  res.end(saida);
});
await new Promise((r) => servidor.listen(4322, r));

const chrome = await chromeLauncher.launch({
  chromePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

await mkdir(path.join(RAIZ, 'docs/medicao'), { recursive: true });
const pct = (n) => Math.round(n * 100);
const ms = (n) => `${(n / 1000).toFixed(2)} s`;
const resumo = [];

for (const modo of ['mobile', 'desktop']) {
  const r = await lighthouse('http://127.0.0.1:4322/', {
    port: chrome.port,
    output: ['html', 'json'],
    logLevel: 'error',
    formFactor: modo,
    screenEmulation: modo === 'desktop'
      ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
      : { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
    throttling: modo === 'desktop'
      ? { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 }
      : { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });

  await writeFile(path.join(RAIZ, `docs/medicao/${modo}.html`), r.report[0]);
  const lhr = r.lhr;
  const a = lhr.audits;
  resumo.push({
    modo,
    perf: pct(lhr.categories.performance.score),
    a11y: pct(lhr.categories.accessibility.score),
    bp: pct(lhr.categories['best-practices'].score),
    seo: pct(lhr.categories.seo.score),
    lcp: a['largest-contentful-paint'].numericValue,
    fcp: a['first-contentful-paint'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue,
    tbt: a['total-blocking-time'].numericValue,
    si: a['speed-index'].numericValue,
    peso: a['total-byte-weight'].numericValue,
    falhas: Object.values(a).filter(
      (x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative'
    ).map((x) => x.title),
  });
}

await chrome.kill();
servidor.close();

console.log('\n  LIGHTHOUSE');
console.log('  ' + '='.repeat(64));
for (const r of resumo) {
  console.log(`\n  ${r.modo.toUpperCase()}`);
  console.log(`    Performance ${String(r.perf).padStart(3)}   Acessibilidade ${String(r.a11y).padStart(3)}   ` +
              `Boas praticas ${String(r.bp).padStart(3)}   SEO ${String(r.seo).padStart(3)}`);
  console.log(`    FCP ${ms(r.fcp)}   LCP ${ms(r.lcp)}   Speed Index ${ms(r.si)}`);
  console.log(`    CLS ${r.cls.toFixed(4)}   TBT ${r.tbt.toFixed(0)} ms   peso total ${(r.peso / 1024).toFixed(1)} KB`);
  if (r.falhas.length) {
    console.log('    auditorias abaixo de 90:');
    r.falhas.forEach((f) => console.log(`      - ${f}`));
  } else {
    console.log('    nenhuma auditoria abaixo de 90');
  }
}
console.log('\n  relatorios completos em docs/medicao/\n');
