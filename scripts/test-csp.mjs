/**
 * Serve o dist/ APLICANDO os cabeçalhos de dist/_headers e abre a página no
 * Chromium com a CSP valendo de verdade.
 *
 * Um hash errado na CSP não quebra o build nem os testes — quebra a página no
 * navegador da compradora, sem estilo e sem JavaScript. Este teste é a única
 * forma de pegar isso antes dela.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = path.resolve(import.meta.dirname, '../dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.txt': 'text/plain', '.xml': 'application/xml' };

/** Lê dist/_headers e devolve os cabeçalhos da regra /*, como a Cloudflare faz. */
const bruto = await readFile(path.join(DIST, '_headers'), 'utf8');
const globais = {};
let regra = null;
for (const linha of bruto.split('\n')) {
  if (!linha.trim()) continue;
  if (!/^\s/.test(linha)) { regra = linha.trim(); continue; }
  const i = linha.indexOf(':');
  if (regra === '/*' && i > 0) globais[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
}

const srv = createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // a página mora sob /smm: a raiz redireciona, então os testes entram direto
  if (rel === '/' || rel === '') rel = '/smm/';
  if (rel === '/smm/obrigado') rel = '/smm/obrigado.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const f = path.join(DIST, rel);
  if (!f.startsWith(DIST) || !existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', ...globais });
  res.end(await readFile(f));
});
await new Promise((r) => srv.listen(4326, r));

console.log('\n  cabecalhos aplicados:');
for (const [k, v] of Object.entries(globais)) console.log(`    ${k}: ${v.slice(0, 88)}${v.length > 88 ? '…' : ''}`);

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const pg = await (await nav.newContext()).newPage();
const violacoes = [];
pg.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violacoes.push(m.text()); });
pg.on('pageerror', (e) => violacoes.push('erro de pagina: ' + e.message));

await pg.goto('http://127.0.0.1:4326/smm/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1200);

const vivo = await pg.evaluate(() => ({
  cssAplicado: getComputedStyle(document.body).backgroundColor,
  fonteAplicada: getComputedStyle(document.querySelector('h1')).fontFamily.includes('Fraunces'),
  jsRodou: !/^—?$/.test(document.querySelector('[data-cd]')?.textContent?.trim() || '—'),
  contador: document.querySelector('[data-cd]')?.textContent?.trim(),
}));

await nav.close();
srv.close();

let falhas = 0;
const ok = (c, m, d = '') => { console.log(`  ${c ? '  ok  ' : ' FALHA'}  ${m}${!c && d ? `  ${d}` : ''}`); if (!c) falhas++; };

console.log('\n  com a CSP valendo:');
ok(violacoes.length === 0, 'nenhuma violacao de CSP no console', violacoes.slice(0, 3).join(' | '));
ok(vivo.cssAplicado !== 'rgba(0, 0, 0, 0)' && vivo.cssAplicado !== '',
   `CSS embutido foi aplicado (fundo ${vivo.cssAplicado})`);
ok(vivo.fonteAplicada, 'fonte propria carregou (font-src self)');
ok(vivo.jsRodou, `JavaScript embutido rodou (contador: ${vivo.contador})`);

console.log(`\n  ${falhas === 0 ? '✔ a pagina funciona inteira sob a CSP' : `✘ ${falhas} falha(s) — a CSP esta quebrando a pagina`}\n`);
process.exit(falhas ? 1 : 0);
