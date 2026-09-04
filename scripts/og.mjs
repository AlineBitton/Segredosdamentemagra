/**
 * Gera a imagem de compartilhamento (1200x630) renderizando um cartão HTML
 * no Chromium. Assim ela usa a mesma tipografia e a mesma paleta da página,
 * e o preço vem do lote vigente — nada de arte solta que envelhece sozinha.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { EVENTO, brl, loteAtivo } from '../config/oferta.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');
const lote = loteAtivo();

const fonte = (await readFile(path.join(RAIZ, 'public/fonts/fraunces-var.woff2'))).toString('base64');
const fonte2 = (await readFile(path.join(RAIZ, 'public/fonts/inter-var.woff2'))).toString('base64');

const cartao = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:F;src:url(data:font/woff2;base64,${fonte}) format('woff2-variations');font-weight:300 900}
@font-face{font-family:I;src:url(data:font/woff2;base64,${fonte2}) format('woff2-variations');font-weight:100 900}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;
 padding:72px 80px;background:radial-gradient(120% 90% at 80% 10%,#16201c 0%,#0C0F0E 62%);
 color:#F6F4F1;font-family:I,sans-serif}
.top{font:600 22px/1 I,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#B9C0BB}
h1{font:600 82px/1.03 F,serif;letter-spacing:-.02em;max-width:17ch}
h1 em{font-style:normal;color:#C9A227}
.bot{display:flex;align-items:flex-end;justify-content:space-between;gap:40px}
.sub{font:400 27px/1.4 I,sans-serif;color:#B9C0BB;max-width:26ch}
.preco{text-align:right;flex:none}
.preco .rot{font:600 19px/1 I,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C9A227}
.preco .val{font:600 74px/1 F,serif;letter-spacing:-.02em;margin-top:10px}
</style></head><body>
<div class="top">${EVENTO.nome} &middot; ${EVENTO.datas}</div>
<h1>O que fez a balança descer <em>não é</em> o que faz ela ficar.</h1>
<div class="bot">
  <div class="sub">3 dias ao vivo com Aline Bitton, para quem já usou caneta, bariátrica ou dieta restritiva.</div>
  <div class="preco"><div class="rot">${lote.nome}</div><div class="val">${brl(lote.centavos)}</div></div>
</div>
</body></html>`;

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const pg = await nav.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await pg.setContent(cartao, { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
const png = await pg.screenshot({ type: 'png' });
await nav.close();

await mkdir(path.join(RAIZ, 'public/img'), { recursive: true });
const jpg = path.join(RAIZ, 'public/img/og.jpg');
await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(jpg);
const { size } = await (await import('node:fs/promises')).stat(jpg);
console.log(`\n  og.jpg  1200x630  ${(size / 1024).toFixed(1)} KB  (lote: ${lote.nome} · ${brl(lote.centavos)})\n`);
