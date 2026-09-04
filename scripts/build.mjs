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
import { gzipSync, brotliCompressSync, constants as zlib } from 'node:zlib';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import * as esbuild from 'esbuild';
import {
  CHECKOUT, EVENTO, META, PROMESSAS, VIP,
  brl, checkoutComum, contadorTexto, loteAtivo, prazoTexto, proximoLote,
} from '../config/oferta.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => path.join(RAIZ, ...s);

/* ordem importa: tokens antes de tudo que os consome */
const CSS = ['tokens.css', 'base.css', 'dobras.css'];

/**
 * Os tetos que importam são os COMPRIMIDOS: é isso que trafega. O tamanho cru
 * do HTML só interessa como sinal de que a marcação está inchando.
 */
const ORCAMENTO = {
  cssCru: 22 * 1024,
  jsCru: 5 * 1024,
  htmlCru: 64 * 1024,
  htmlBr: 14 * 1024,      // o que a Cloudflare entrega de fato
  dobra1: 120 * 1024,     // html comprimido + as duas fontes
};

const SITE = 'https://afinandocorpoemente.com.br';

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/**
 * Meta Pixel. Enquanto META.pixelId for null, NADA e injetado — a pagina
 * nao carrega script de terceiro nenhum, e a politica de privacidade continua
 * verdadeira. Assim que o ID entrar no config, o snippet aparece sozinho.
 */
function pixelCabecalho() {
  if (!META.pixelId) return '';
  return `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
    `n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;` +
    `n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;` +
    `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
    `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
    `fbq('init','${META.pixelId}');fbq('track','PageView');</script>` +
    `<noscript><img height="1" width="1" style="display:none" alt=""` +
    ` src="https://www.facebook.com/tr?id=${META.pixelId}&ev=PageView&noscript=1"></noscript>`;
}

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
    'contador': contadorTexto(agora),
    'prazo-extenso': prazoTexto(agora),
    'lote-id': lote.id,
    'checkout-comum': checkoutComum(lote),
    'checkout-vip': CHECKOUT.vip,
    'ancora-vip': VIP.ancoraAvulsaCentavos && lote.centavos != null
      ? `<p class="plano__ancora" data-slot="ancora-vip">O Diagnóstico dos 5 Corpos, avulso, custa ${brl(VIP.ancoraAvulsaCentavos)}. Aqui ele entra por ${brl(VIP.centavos - lote.centavos)} a mais.</p>`
      : '',
    'promessa-h1': padrao.h1,
    'promessa-sub': padrao.sub,
  };

  /* ---------- HTML ---------- */
  // Todo .html em src/ vira uma pagina. So a index leva JavaScript: as
  // paginas legais nao tem contador, barra fixa nem rastreio.
  const paginas = (await readdir(p('src'))).filter((f) => f.endsWith('.html'));
  let html = '';

  for (const arquivo of paginas) {
    let doc = await readFile(p('src', arquivo), 'utf8');
    const ehIndex = arquivo === 'index.html';

    doc = doc
      .replace('<!--CSS-->', `<style>${css}</style>${ehIndex ? pixelCabecalho() : ''}`)
      .replace('<!--JS-->', ehIndex && js ? `<script>${js}</script>` : '');

    doc = doc.replace(/\{\{([\w-]+)\}\}/g, (m, chave) => {
      if (!(chave in valores)) throw new Error(`placeholder desconhecido em ${arquivo}: {{${chave}}}`);
      return valores[chave];
    });

    doc = minificarHtml(doc);
    await writeFile(p('dist', arquivo), doc);
    if (ehIndex) html = doc;
  }

  /* ---------- robots e sitemap ---------- */
  const hoje = new Date().toISOString().slice(0, 10);
  await writeFile(p('dist/robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /termos\nDisallow: /privacidade\n\nSitemap: ${SITE}/sitemap.xml\n`);
  await writeFile(p('dist/sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${SITE}/</loc><lastmod>${hoje}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n` +
    `</urlset>\n`);

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
  const htmlCru = Buffer.byteLength(html);
  const htmlGz = gzipSync(html, { level: 9 }).length;
  const htmlBr = brotliCompressSync(Buffer.from(html), {
    params: { [zlib.BROTLI_PARAM_QUALITY]: 11 },
  }).length;

  linha('CSS minificado', Buffer.byteLength(css), ORCAMENTO.cssCru);
  linha('JS minificado', Buffer.byteLength(js), ORCAMENTO.jsCru);
  linha('index.html cru', htmlCru, ORCAMENTO.htmlCru);
  console.log(`  ..    ${'index.html gzip'.padEnd(22)} ${kb(htmlGz).padStart(9)}`);
  linha('index.html brotli', htmlBr, ORCAMENTO.htmlBr);

  const fontes = await pesoDe(p('dist/fonts'));
  console.log(`  ..    ${'fontes (woff2)'.padEnd(22)} ${kb(fontes).padStart(9)}`);
  const total = htmlBr + fontes;
  console.log('  ' + '-'.repeat(58));
  linha('TRANSFERENCIA 1a dobra', total, ORCAMENTO.dobra1);
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
    // um espaco, nao zero: colar as tags remove espaco significativo entre
    // elementos inline ("R$ 27" + "a vista" virava "R$ 27a vista"). Layouts
    // de bloco, flex e grid ignoram texto so-de-espaco, entao nao ha custo.
    .replace(/>\s+</g, '> <')
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
