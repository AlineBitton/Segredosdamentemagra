/** Sobe o dist/ num servidor local e captura a página em mobile e desktop. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

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
  const arquivo = path.join(DIST, rel);
  if (!arquivo.startsWith(DIST) || !existsSync(arquivo)) {
    res.writeHead(404).end('nao encontrado');
    return;
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
  res.end(await readFile(arquivo));
});

await new Promise((r) => servidor.listen(4321, r));

const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const alvos = [
  { nome: 'mobile', width: 390, height: 844, dsf: 2 },
  { nome: 'desktop', width: 1440, height: 900, dsf: 1 },
];

for (const a of alvos) {
  const ctx = await navegador.newContext({
    viewport: { width: a.width, height: a.height },
    deviceScaleFactor: a.dsf,
  });
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  pg.on('pageerror', (e) => erros.push(String(e)));

  await pg.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
  // revela tudo e força o carregamento das imagens lazy antes de capturar
  await pg.evaluate(async () => {
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visivel'));
    const alt = document.documentElement.scrollHeight;
    for (let y = 0; y < alt; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].filter((i) => !i.complete)
      .map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
  });
  await pg.waitForTimeout(600);

  await pg.screenshot({ path: `docs/capturas/${a.nome}-completa.png`, fullPage: true });
  await pg.screenshot({ path: `docs/capturas/${a.nome}-dobra1.png` });
  for (const [nome, sel] of [['oferta','#oferta'],['mecanismo','.mecanismo'],['caminhos','.caminhos'],['provas','.provas'],['agregado','.agregado']]) {
    const el = await pg.$(sel);
    if (el) await el.screenshot({ path: `docs/capturas/${a.nome}-${nome}.png` });
  }

  const largura = await pg.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    janela: window.innerWidth,
    altura: document.documentElement.scrollHeight,
  }));
  console.log(
    `  ${a.nome.padEnd(8)} ${a.width}x${a.height}  altura ${largura.altura}px  ` +
    `${largura.scroll > largura.janela ? 'ESTOURO HORIZONTAL' : 'sem estouro horizontal'}` +
    `${erros.length ? `  ERROS: ${erros.join(' | ')}` : '  sem erros de console'}`
  );
  await ctx.close();
}

await navegador.close();
servidor.close();
