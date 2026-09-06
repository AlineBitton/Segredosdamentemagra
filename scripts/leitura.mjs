/**
 * Auditoria de leitura no navegador.
 *
 * Diferente de scripts/contraste.mjs, que testa os pares do sistema, este
 * abre a página de verdade e mede CADA elemento de texto contra o fundo que
 * está realmente pintado atrás dele — subindo a árvore até achar quem pinta.
 * É assim que aparece o caso que o teste de tokens não pega: o bloco cujo
 * fundo some porque é igual ao do campo em que ele está.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const TIPOS = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.woff2':'font/woff2', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png',
  '.avif':'image/avif', '.webp':'image/webp' };

const srv = createServer(async (req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const f = path.join(DIST, rel);
  if (!f.startsWith(DIST) || !existsSync(f)) return void res.writeHead(404).end('404');
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
});
await new Promise((r) => srv.listen(4329, r));

const nav = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});
const ctx = await nav.newContext({ viewport: { width: 1440, height: 1000 } });
const pg = await ctx.newPage();
await pg.goto('http://127.0.0.1:4329/', { waitUntil: 'networkidle' });
await pg.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('visivel')));
await pg.waitForTimeout(400);

const achados = await pg.evaluate(() => {
  const lin = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const opaco = (s) => { const v = rgb(s); return v.length >= 3 && (v[3] === undefined || v[3] === 1); };
  const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };

  // sobe a árvore até achar quem realmente pinta o fundo
  const fundoDe = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (opaco(bg)) return { cor: rgb(bg).slice(0, 3), quem: n };
    }
    return { cor: [255, 255, 255], quem: document.body };
  };

  const nome = (el) => el.tagName.toLowerCase() +
    (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');

  const out = [];
  const vistos = new Set();
  for (const el of document.querySelectorAll('body *')) {
    // só elementos que realmente pintam texto próprio
    const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!proprio) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;

    const frente = rgb(cs.color).slice(0, 3);
    const { cor: fundo, quem } = fundoDe(el);
    const px = parseFloat(cs.fontSize);
    const peso = parseInt(cs.fontWeight, 10) || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const min = grande ? 3 : 4.5;
    const v = razao(frente, fundo);
    if (v >= min) continue;

    const chave = nome(el) + v.toFixed(2);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    out.push({
      alvo: nome(el), fundoDe: nome(quem),
      texto: (el.textContent || '').trim().slice(0, 52),
      frente: `rgb(${frente})`, fundo: `rgb(${fundo})`,
      px: Math.round(px), peso, razao: +v.toFixed(2), min,
    });
  }

  // segundo teste: bloco cujo fundo é igual ao do pai — “caixa que some”
  const somem = [];
  for (const el of document.querySelectorAll('.plano, .destaque, .garantia__caixa, .proporcao, .card, .faq details, .caminho, .prova, .percurso__quadro, .guia__foto, .emocional__foto')) {
    const bg = getComputedStyle(el).backgroundColor;
    if (!opaco(bg)) continue;
    const pai = fundoDe(el.parentElement);
    const v = razao(rgb(bg).slice(0, 3), pai.cor);
    if (v < 1.06) somem.push({ alvo: nome(el), dentroDe: nome(pai.quem), razao: +v.toFixed(3) });
  }
  return { baixos: out, somem };
});

await nav.close(); srv.close();

const { baixos, somem } = achados;
console.log('\n  LEITURA — contraste medido no navegador');
console.log('  ' + '─'.repeat(74));
if (!baixos.length) console.log('  ok    nenhum texto abaixo do mínimo');
for (const b of baixos) {
  console.log(` FALHA  ${b.razao}:1 (min ${b.min})  ${b.alvo}  ${b.px}px/${b.peso}`);
  console.log(`        ${b.frente} sobre ${b.fundo}, pintado por ${b.fundoDe}`);
  console.log(`        “${b.texto}”`);
}
console.log('\n  CAIXAS QUE SOMEM — fundo igual ao do campo atrás');
console.log('  ' + '─'.repeat(74));
if (!somem.length) console.log('  ok    todo bloco com fundo se distingue do campo');
for (const s of somem) console.log(` AVISO  ${s.alvo} dentro de ${s.dentroDe} — razão ${s.razao}:1`);
console.log('');
process.exit(baixos.length ? 1 : 0);
