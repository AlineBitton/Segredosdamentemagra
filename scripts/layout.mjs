/**
 * Captura o layout inteiro em três imagens contíguas, cortadas em bordas
 * naturais de dobra — para revisão do desenho, não para medição.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const SAIDA = path.join(RAIZ, 'docs', 'capturas');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.avif': 'image/avif', '.webp': 'image/webp',
};

const servidor = createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const arquivo = path.join(DIST, rel);
  if (!arquivo.startsWith(DIST) || !existsSync(arquivo)) return void res.writeHead(404).end('nao encontrado');
  res.writeHead(200, { 'content-type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
  res.end(await readFile(arquivo));
});
await new Promise((r) => servidor.listen(4327, r));
await mkdir(SAIDA, { recursive: true });

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const ctx = await nav.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const pg = await ctx.newPage();
const alvo = process.env.SMM_PAGINA || '/';
await pg.goto('http://127.0.0.1:4327' + alvo, { waitUntil: 'networkidle' });
await pg.evaluate(() => {
  document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visivel'));
  document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  document.querySelector('.barra')?.remove();          // a barra fixa cobriria o corte
  document.documentElement.style.scrollBehavior = 'auto';
});
await pg.waitForLoadState('networkidle');
await pg.waitForTimeout(600);

// Os cortes acontecem no topo destas seções, para nenhuma dobra ficar partida.
if (alvo !== '/') {
  // páginas secundárias saem em um quadro só
  const alt = await pg.evaluate(() => document.documentElement.scrollHeight);
  const nome = 'final-' + alvo.replace(/\W/g, '') ;
  await pg.screenshot({ path: path.join(SAIDA, nome + '.png'), fullPage: true });
  console.log(`  ${nome}.png  1440x${alt}`);
  await nav.close(); servidor.close();
  process.exit(0);
}

const cortes = await pg.evaluate(() => {
  const secoes = [...document.querySelectorAll('main > section, main > footer, body > footer')];
  const topo = (el) => Math.round(el.getBoundingClientRect().top + window.scrollY);
  return {
    total: Math.round(document.documentElement.scrollHeight),
    largura: Math.round(document.documentElement.scrollWidth),
    emocional: topo(document.querySelector('.emocional')),
    caminhos: topo(document.querySelector('.caminhos').closest('section')),
    n: secoes.length,
  };
});

const partes = [
  ['final-01-abertura',  0,                  cortes.emocional],
  ['final-02-mecanismo', cortes.emocional,   cortes.caminhos],
  ['final-03-oferta',    cortes.caminhos,    cortes.total],
];

for (const [nome, y, ate] of partes) {
  const altura = ate - y;
  await pg.screenshot({
    path: path.join(SAIDA, `${nome}.png`),
    fullPage: true,
    clip: { x: 0, y, width: cortes.largura, height: altura },
  });
  console.log(`  ${nome}.png  ${cortes.largura}×${altura}`);
}

console.log(`\n  página inteira: ${cortes.largura}×${cortes.total} px, ${cortes.n} dobras\n`);
await nav.close();
servidor.close();
