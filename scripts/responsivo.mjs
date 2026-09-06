/**
 * Testa as duas páginas em sete larguras reais, do menor celular ao desktop
 * largo. Procura o que quebra layout de verdade: rolagem horizontal, texto
 * que estoura o container, alvo de toque pequeno demais e imagem deformada.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const TIPOS = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.woff2':'font/woff2', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.webp':'image/webp', '.avif':'image/avif' };

const srv = createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // a página mora sob /smm: a raiz redireciona, então os testes entram direto
  if (rel === '/' || rel === '') rel = '/smm/';
  if (rel === '/smm/obrigado') rel = '/smm/obrigado.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const f = path.join(DIST, rel);
  if (!f.startsWith(DIST) || !existsSync(f)) return void res.writeHead(404).end('404');
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
});
await new Promise((r) => srv.listen(4336, r));

const LARGURAS = [
  [320, 'menor celular em uso'],
  [360, 'Android comum'],
  [390, 'iPhone'],
  [430, 'iPhone Max'],
  [768, 'tablet retrato'],
  [1024, 'tablet paisagem'],
  [1440, 'desktop'],
];
const PAGINAS = [['/smm/', 'venda'], ['/smm/obrigado', 'agradecimento']];

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});

let falhas = 0;
for (const [rota, nomePagina] of PAGINAS) {
  console.log(`\n  ${nomePagina.toUpperCase()}  ${rota}`);
  console.log('  ' + '─'.repeat(70));
  for (const [w, apelido] of LARGURAS) {
    const ctx = await nav.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.goto('http://127.0.0.1:4336' + rota, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visivel')));
    await pg.waitForTimeout(250);

    const r = await pg.evaluate(() => {
      const doc = document.documentElement;
      const estoura = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
        const b = el.getBoundingClientRect();
        if (!b.width) continue;
        // só reporta quem realmente ultrapassa a viewport
        if (b.right > doc.clientWidth + 1 || b.left < -1) {
          const n = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className
            ? '.' + el.className.trim().split(/\s+/)[0] : '');
          if (!estoura.includes(n)) estoura.push(n);
        }
      }
      const pequenos = [];
      for (const el of document.querySelectorAll('a, button, summary')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        // link de pular navegação é 1px por definição até receber foco:
        // medir o tamanho dele em repouso é medir a coisa errada
        if (el.closest('.so-leitor') || el.classList.contains('so-leitor')) continue;
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        if (b.height < 24 || b.width < 24) pequenos.push((el.textContent || '').trim().slice(0, 28));
      }
      return {
        rolagemH: doc.scrollWidth > doc.clientWidth,
        estoura: estoura.slice(0, 4),
        pequenos: pequenos.slice(0, 3),
        altura: doc.scrollHeight,
      };
    });

    const ruim = r.rolagemH || r.estoura.length || r.pequenos.length;
    if (ruim) falhas++;
    const marca = ruim ? 'FALHA' : ' ok  ';
    console.log(`  ${marca}  ${String(w).padStart(4)}px  ${apelido.padEnd(22)} altura ${r.altura}px`);
    if (r.rolagemH) console.log('          rolagem horizontal');
    if (r.estoura.length) console.log('          estoura a viewport: ' + r.estoura.join(', '));
    if (r.pequenos.length) console.log('          alvo pequeno demais: ' + r.pequenos.join(' | '));
    await ctx.close();
  }
}
await nav.close(); srv.close();
console.log(`\n  ${falhas === 0 ? '✔ responsivo em todas as larguras' : `✘ ${falhas} largura(s) com problema`}\n`);
process.exit(falhas ? 1 : 0);
