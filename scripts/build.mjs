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
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import * as esbuild from 'esbuild';
import {
  CHECKOUT, EVENTO, LOTES, META, PROMESSAS, VIP,
  brl, checkoutComum, contadorTexto, linkWhatsApp, loteAtivo, prazoTexto, proximoLote,
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
  cssCru: 25 * 1024,     // subiu de 22 com as grades editoriais do redesign
  jsCru: 5 * 1024,
  htmlCru: 64 * 1024,
  htmlBr: 16 * 1024,      // o que a Cloudflare entrega de fato
                          // (subiu de 14 quando a biografia real entrou)
  dobra1: 120 * 1024,     // html comprimido + as duas fontes
};

const SITE = 'https://afinandocorpoemente.com.br';

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/**
 * Meta Pixel. Enquanto META.pixelId for null, NADA e injetado — a pagina
 * nao carrega script de terceiro nenhum, e a politica de privacidade continua
 * verdadeira. Assim que o ID entrar no config, o snippet aparece sozinho.
 */
function pixelCabecalho(extra = '') {
  if (!META.pixelId) return '';
  return `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
    `n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;` +
    `n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;` +
    `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
    `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
    `fbq('init','${META.pixelId}');fbq('track','PageView');${extra}</script>` +
    `<noscript><img height="1" width="1" style="display:none" alt=""` +
    ` src="https://www.facebook.com/tr?id=${META.pixelId}&ev=PageView&noscript=1"></noscript>`;
}

/**
 * Evento de compra na página de agradecimento.
 *
 * Dispara Purchase (o evento padrão que o Gerenciador entende) e, junto, o
 * evento com o nome que as campanhas da Aline usam. Sem valor: a página não
 * sabe qual ingresso foi comprado, e mandar um número errado é pior que não
 * mandar nenhum — quem tem o valor certo é a Hubla, pela Conversion API.
 */
function pixelCompra() {
  if (!META.pixelId) return '';
  const nome = META.eventoCompra.replace(/'/g, "\\'");
  return `fbq('track','Purchase',{currency:'BRL',content_category:'Imersao Segredos da Mente Magra'});` +
    `fbq('trackCustom','${nome}');`;
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

  /* ---------- valores do lote vigente ----------
     SMM_AGORA permite construir a pagina como ela ficara numa data futura.
     Serve para revisar cada lote e o estado de encerrado antes que aconteca:
       SMM_AGORA="2026-09-12 10:00" npm run build
     Sem a variavel, usa o relogio real. */
  const agora = process.env.SMM_AGORA
    ? Date.parse(process.env.SMM_AGORA.replace(' ', 'T') +
        (/[Z+]|-\d\d:\d\d$/.test(process.env.SMM_AGORA) ? '' : '-03:00'))
    : Date.now();
  if (Number.isNaN(agora)) throw new Error(`SMM_AGORA invalido: ${process.env.SMM_AGORA}`);
  if (process.env.SMM_AGORA) {
    console.log(`\n  ** simulando ${new Date(agora).toISOString()} (SMM_AGORA) **`);
  }
  const lote = loteAtivo(agora);
  const proximo = proximoLote(agora);
  const padrao = PROMESSAS.padrao;

  // Quando cada lote abre, em texto — o dia seguinte ao fim do anterior.
  const abrePorLote = {};
  LOTES.forEach((l, i) => {
    if (i === 0) return;
    const d = new Date(Date.parse(LOTES[i - 1].fim) + 1);
    abrePorLote[l.id] = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
    }).format(d);
  });
  const PROVAS = ['01','02','03','04','05','06','07','08','09','10','11','12'];

  const valores = {
    'lote-nome': lote.nome,
    'preco-comum': lote.centavos == null ? '—' : brl(lote.centavos),
    'preco-proximo': proximo ? brl(proximo.centavos) : '',
    'proximo-aviso': proximo
      ? `Depois, o Comum passa para ${brl(proximo.centavos)}.`
      : 'Este é o último lote — as inscrições encerram no dia 25 de setembro.',
    'preco-vip': brl(VIP.centavos),
    'deadline': lote.fim || '',
    'contador': contadorTexto(agora),
    'prazo-extenso': prazoTexto(agora),
    'lote-id': lote.id,
    'encerrado-attr': lote.id === 'encerrado' ? ' data-encerrado' : '',
    'checkout-comum': checkoutComum(lote),
    'checkout-vip': CHECKOUT.vip,
    'zap-duvida': linkWhatsApp('Oi! Quero tirar uma dúvida sobre a Imersão Segredos da Mente Magra.'),
    'zap-proxima': linkWhatsApp('Oi! Quero saber da próxima turma da Imersão Segredos da Mente Magra.'),
    'evento-inicio': EVENTO.inicioISO,
    // Lembrete no Google Agenda, cobrindo os três encontros. O formato de
    // data do Google é UTC compacto: 20260925T220000Z.
    'agenda-google': (() => {
      const z = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const fim = '2026-09-27T16:00:00.000Z';   // domingo, 13h de Brasília
      const q = new URLSearchParams({
        action: 'TEMPLATE',
        text: 'Imersão Segredos da Mente Magra — com Aline Bitton',
        dates: `${z(EVENTO.inicioISO)}/${z(fim)}`,
        details: 'Sexta 25/09, 19h às 20h30 — aula de abertura.\nSábado 26/09, 10h às 17h.\nDomingo 27/09, 10h às 13h.\n\nO link do Google Meet chega no grupo do WhatsApp.',
        location: 'Google Meet',
      });
      return `https://calendar.google.com/calendar/render?${q}`;
    })(),
    'zap-ticket': linkWhatsApp('Oi! Acabei de garantir minha vaga na Imersão Segredos da Mente Magra e quero receber o meu ticket para o evento.'),
    'zap-nao-chegou': linkWhatsApp('Oi! Garantei minha vaga na Imersão e preciso de ajuda com a minha inscrição.'),
    // blocos gerados: a agenda, a escada de lotes e a galeria de provas
    'agenda': EVENTO.encontros.map((e, i) => `
      <li class="agenda__item">
        <div class="agenda__quando">
          <span class="agenda__dia">${e.dia}</span>
          <span class="agenda__hora">${e.hora}</span>
        </div>
        <div class="agenda__oque">
          <p class="etiqueta">${e.etiqueta}</p>
          ${e.titulo
            ? `<h3 class="agenda__titulo">${e.titulo}</h3>`
            : `<h3 class="agenda__titulo agenda__titulo--pendente">Tema a confirmar</h3>`}
          <p>${e.texto}</p>
        </div>
      </li>`).join(''),
    'escada': LOTES.map((l) => {
      const abre = l.id === LOTES[0].id ? 'até 9 de setembro'
        : `a partir de ${abrePorLote[l.id]}`;
      const atual = l.id === lote.id;
      return `<li${atual ? ' data-atual' : ''}><span class="escada__preco">${brl(l.centavos)}</span>` +
             `<span class="escada__quando">${l.nome}, ${abre}</span></li>`;
    }).join(''),
    'provas': PROVAS.map((n) => `
      <li class="prova">
        <picture>
          <source type="image/avif" srcset="/img/provas/${n}-400.avif">
          <img src="/img/provas/${n}-400.webp" width="400" height="500"
               loading="lazy" decoding="async" alt="Depoimento de aluna da Imersão Segredos da Mente Magra">
        </picture>
      </li>`).join(''),
    'ancora-vip': VIP.ancoraAvulsaCentavos && lote.centavos != null
      ? `<p class="plano__ancora" data-slot="ancora-vip">O Diagnóstico dos 5 Corpos, avulso, custa ${brl(VIP.ancoraAvulsaCentavos)}. Aqui ele entra por ${brl(VIP.centavos - lote.centavos)} a mais.</p>`
      : '',
    'promessa-h1': padrao.h1,
    'promessa-linha2': padrao.linha2 || '',
    'promessa-sub': padrao.sub,
    'evento-datas': EVENTO.datas,
    'evento-total': EVENTO.totalHoras,
    // Enquanto os retratos não existem, a página se fecha sem eles: a capa
    // vira composição de tipo e as dobras viram coluna única. Nada de moldura
    // vazia — quem visita não precisa saber que falta foto.
    'sem-foto-attr': existsSync(p('public/img/aline-mentora-1200.webp')) ? '' : ' data-sem-foto',
  };

  /* ---------- HTML ---------- */
  // Todo .html em src/ vira uma pagina. So a index leva JavaScript: as
  // paginas legais nao tem contador, barra fixa nem rastreio.
  const paginas = (await readdir(p('src'))).filter((f) => f.endsWith('.html'));
  let html = '';

  for (const arquivo of paginas) {
    let doc = await readFile(p('src', arquivo), 'utf8');
    const ehIndex = arquivo === 'index.html';
    // a página de agradecimento também conta o tempo — até o evento
    const levaJs = ehIndex || arquivo === 'obrigado.html';

    doc = doc
      .replace('<!--CSS-->', `<style>${css}</style>` +
        (ehIndex ? pixelCabecalho()
          : arquivo === 'obrigado.html' ? pixelCabecalho(pixelCompra()) : ''))
      .replace('<!--JS-->', levaJs && js ? `<script>${js}</script>` : '');

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
  if (existsSync(p('src/_redirects'))) await cp(p('src/_redirects'), p('dist/_redirects'));

  /* ---------- cabeçalhos, com CSP por hash ----------
     A página embute CSS e JS. A saída fácil seria 'unsafe-inline', que
     desliga justamente a proteção contra XSS que a CSP existe para dar.
     Como o build conhece o conteúdo exato de cada bloco, ele calcula o
     hash SHA-256 de cada um — assim só o nosso código roda, e qualquer
     script injetado é bloqueado pelo navegador. */
  const sha = (txt) => `'sha256-${createHash('sha256').update(txt, 'utf8').digest('base64')}'`;
  const hashesScript = [sha(js)];
  if (META.pixelId) {
    for (const s of [pixelCabecalho(), pixelCabecalho(pixelCompra())]) {
      const m = s.match(/<script>([\s\S]*?)<\/script>/);
      if (m) hashesScript.push(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
    }
  }
  if (false) {
    const snippet = pixelCabecalho().match(/<script>([\s\S]*?)<\/script>/);
    if (snippet) hashesScript.push(sha(snippet[1]));
  }
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${hashesScript.join(' ')}${META.pixelId ? ' https://connect.facebook.net' : ''}`,
    `style-src 'self' ${sha(css)}`,
    `img-src 'self'${META.pixelId ? ' https://www.facebook.com' : ''}`,
    "font-src 'self'",
    `connect-src 'self'${META.pixelId ? ' https://www.facebook.com' : ''}`,
    "form-action 'none'",      // a página não tem formulário; bloqueia formulário injetado
    "frame-ancestors 'none'",  // ninguém embute esta página num iframe
    "base-uri 'none'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');

  const cabecalhosBase = existsSync(p('src/_headers'))
    ? await readFile(p('src/_headers'), 'utf8')
    : '';
  await writeFile(p('dist/_headers'),
    cabecalhosBase.trimEnd() + `\n  Content-Security-Policy: ${csp}\n` +
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains\n' +
    '  Cross-Origin-Opener-Policy: same-origin\n');

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
