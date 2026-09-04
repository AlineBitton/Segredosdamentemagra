/**
 * Build da landing page.
 *
 * Decisões que valem explicação:
 *
 * · TODO o CSS vai inline. O total minificado cabe em poucos KB e, dentro do
 *   HTML, o Brotli da Cloudflare comprime junto com a marcação. Resultado:
 *   ZERO requisição de CSS no caminho crítico — melhor do que qualquer
 *   estratégia de "critical CSS + resto diferido", que sempre custa 1 request.
 *
 * · O JavaScript também vai inline, no fim do body. São ~2 KB; uma requisição
 *   separada custaria mais em latência do que economizaria em cache.
 *
 * · Os placeholders {{...}} são preenchidos aqui com o lote vigente. A função de
 *   borda sobrescreve esses mesmos pontos a cada request. Se a borda falhar, a
 *   página continua correta — apenas congelada no lote do build.
 */
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import * as esbuild from 'esbuild';
import {
  CHECKOUT, PROMESSAS, VIP,
  brl, checkoutComum, loteAtivo, proximoLote,
} from '../config/oferta.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => path.join(RAIZ, ...s);

/* ordem importa: tokens antes de tudo que os consome */
const CSS = ['tokens.css', 'base.css', 'dobras.css'];

const ORCAMENTO = {
  html: 26 * 1024,   // já com CSS e JS embutidos
  css: 22 * 1024,
  js: 5 * 1024,
  dobra1: 120 * 1024,
};

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function main() {
  await rm(p('dist'), { recursive: true, force: true });
  await mkdir(p('dist'), { recursive: true });

  /* ---------- CSS ---------- */
  const cssBruto = (
    await Promise.all(CSS.map((f) => readFile(p('src/styles', f), 'utf8')))
  ).join('\n');

  const { code: cssMin } = transform({
    filename: 'bundle.css',
    code: Buffer.from(cssBruto),
    minify: true,
    targets: { chrome: 111 << 16, safari: (16 << 16) | (4 << 8), firefox: 113 << 16 },
  });
  const css = cssMin.toString();

  /* ---------- JS ---------- */
  const jsFonte = p('src/js/app.js');
  let js = '';
  if (existsSync(jsFonte)) {
    const r = await esbuild.build({
      entryPoints: [jsFonte],
      bundle: true,
      minify: true,
      format: 'iife',
      target: ['chrome111', 'safari16', 'firefox113'],
      write: false,
      legalComments: 'none',
    });
    js = r.outputFiles[0].text.trim();
  }

  /* ---------- valores do lote vigente ---------- */
  const agora = Date.now();
  const lote = loteAtivo(agora);
  const proximo = proximoLote(agora);
  const padrao = PROMESSAS.padrao;

  const valores = {
    'lote-nome': lote.nome,
    'preco-comum': lote.centavos == null ? '--' : brl(lote.centavos),
    'preco-proximo': proximo ? brl(proximo.centavos) : '',
    'preco-vip': brl(VIP.centavos),
    'deadline': lote.fim || '',
    'lote-id': lote.id,
    'checkout-comum': checkoutComum(lote),
    'checkout-vip': CHECKOUT.vip,
    'promessa-h1': padrao.h1,
    'promessa-sub': padrao.sub,
  };

  /* ---------- HTML ---------- */
  let html = await readFile(p('src/index.html'), 'utf8');

  html = html
    .replace('<!--CSS-->', `<style>${css}</style>`)
    .replace('<!--JS-->', js ? `<script>${js}</script>` : '');

  html = html.replace(/\{\{([\w-]+)\}\}/g, (m, chave) => {
    if (!(chave in valores)) throw new Error(`placeholder desconhecido no HTML: {{${chave}}}`);
    return valores[chave];
  });

  html = minificarHtml(html);
  await writeFile(p('dist/index.html'), html);

  /* ---------- estáticos ---------- */
  if (existsSync(p('public'))) await cp(p('public'), p('dist'), { recursive: true });
  for (const f of ['_headers', '_redirects']) {
    if (existsSync(p('src', f))) await cp(p('src', f), p('dist', f));
  }

  /* ---------- relatório ---------- */
  console.log('\n  orcamento de peso');
  console.log('  ' + '-'.repeat(58));
  let estourou = false;
  const linha = (nome, bytes, teto) => {
    const ok = bytes <= teto;
    if (!ok) estourou = true;
    console.log(`  ${ok ? 'ok  ' : 'FURO'}  ${nome.padEnd(22)} ${kb(bytes).padStart(9)} / ${kb(teto)}`);
  };
  linha('CSS (minificado)', Buffer.byteLength(css), ORCAMENTO.css);
  linha('JS (minificado)', Buffer.byteLength(js), ORCAMENTO.js);
  linha('index.html (tudo)', Buffer.byteLength(html), ORCAMENTO.html);

  const fontes = await pesoDe(p('dist/fonts'));
  console.log(`  ..    ${'fontes'.padEnd(22)} ${kb(fontes).padStart(9)}`);
  const total = Buffer.byteLength(html) + fontes;
  console.log('  ' + '-'.repeat(58));
  linha('primeira dobra', total, ORCAMENTO.dobra1);
  console.log(`\n  ${estourou ? 'X orcamento estourado' : 'OK dentro do orcamento'}\n`);
  if (estourou) process.exitCode = 1;
}

/** Minificacao conservadora: nunca toca no conteudo de script, style, pre. */
function minificarHtml(s) {
  const guardados = [];
  s = s.replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi, (m) => {
    guardados.push(m);
    return `@@G${guardados.length - 1}@@`;
  });
  s = s
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/\n\s*/g, '\n')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return s.replace(/@@G(\d+)@@/g, (_, i) => guardados[+i]);
}

async function pesoDe(dir) {
  if (!existsSync(dir)) return 0;
  let t = 0;
  for (const f of await readdir(dir)) t += (await stat(path.join(dir, f))).size;
  return t;
}

main().catch((e) => {
  console.error('\n  build falhou:', e.message, '\n');
  process.exit(1);
});
