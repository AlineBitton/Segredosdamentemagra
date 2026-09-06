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
  // a página mora sob /smm: a raiz redireciona, então os testes entram direto
  if (rel === '/' || rel === '') rel = '/smm/';
  if (rel === '/smm/obrigado') rel = '/smm/obrigado.html';
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

  await pg.goto('http://127.0.0.1:4321/smm/', { waitUntil: 'networkidle' });
  // Rolar a pagina inteira para acordar as imagens lazy era lento demais
  // (a pagina tem mais de 20 mil pixels de altura). Trocar loading=lazy por
  // eager e deixar o networkidle resolver faz o mesmo em uma fracao do tempo.
  await pg.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visivel'));
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  });
  await pg.waitForLoadState('networkidle');
  await pg.waitForTimeout(500);

  await pg.screenshot({ path: `docs/capturas/${a.nome}-dobra1.png` });
  for (const [nome, sel] of [['oferta','#oferta'],['mecanismo','.mecanismo'],['caminhos','.caminhos'],['provas','.provas'],['agregado','.agregado'],['faq','.faq'],['garantia','.garantia__caixa'],['publico','.publico'],['rodape','.rodape']]) {
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
