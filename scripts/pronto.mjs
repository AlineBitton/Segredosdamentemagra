/**
 * Checagem de pré-voo. Roda sobre o dist/ e reprova se algo que impediria
 * a página de funcionar em produção ainda estiver pendente.
 *
 * A ideia é que ninguém consiga publicar com placeholder no ar por
 * distração. Erro trava; aviso apenas informa.
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { CHECKOUT, EVENTO, LOTES, META, VIP } from '../config/oferta.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');
const DIST = path.join(RAIZ, 'dist');

const erros = [];
const avisos = [];
const erro = (m, comoResolver) => erros.push({ m, comoResolver });
const aviso = (m, comoResolver) => avisos.push({ m, comoResolver });

if (!existsSync(DIST)) {
  console.error('\n  dist/ nao existe. Rode `npm run build` antes.\n');
  process.exit(1);
}

/* ── conteúdo gerado ──────────────────────────────────────────── */
const arquivos = (await readdir(DIST)).filter((f) => f.endsWith('.html'));
for (const f of arquivos) {
  const html = await readFile(path.join(DIST, f), 'utf8');

  const pendentes = [...html.matchAll(/\[\[PRECISO:?([^\]]*)\]\]/g)].map((m) => m[1].trim());
  for (const p of new Set(pendentes)) {
    erro(`${f}: marcador visivel na pagina — "${p}"`, 'preencha o dado e rode npm run build');
  }

  if (html.includes('55DDDNUMERO')) {
    erro(`${f}: botao do WhatsApp aponta para um numero de exemplo`,
         'troque 55DDDNUMERO pelo numero real em src/index.html');
  }
  if (html.includes('placeholder-retrato')) {
    aviso(`${f}: ainda usa a imagem provisoria no lugar das fotos`,
          'coloque as fotos em public/img/ e ajuste os <img> correspondentes');
  }
  if (f === 'index.html') {
    if (!/<h1[^>]*>[\s\S]*?<\/h1>/.test(html)) erro('index.html: sem <h1>', '');
    if (!html.includes('og:image')) erro('index.html: sem og:image', '');
  }
}

/* ── arquivos que precisam existir ────────────────────────────── */
for (const f of ['index.html', 'termos.html', 'privacidade.html', 'robots.txt',
                 'sitemap.xml', '_headers', 'img/og.jpg', 'img/favicon.svg',
                 'fonts/fraunces-var.woff2', 'fonts/inter-var.woff2']) {
  if (!existsSync(path.join(DIST, f))) erro(`falta ${f} no dist/`, 'rode npm run build');
}

/* ── configuração da oferta ───────────────────────────────────── */
// o horario nao impede publicar (o acesso e combinado por WhatsApp), mas a
// pagina converte melhor dizendo a que horas comeca
if (!EVENTO.horario) aviso('horario de inicio nao definido',
  'a pagina nao diz a que horas os 3 dias comecam — e a pergunta que mais chega no suporte');
if (!EVENTO.plataforma) erro('EVENTO.plataforma nao definida', 'preencha em config/oferta.mjs');

const semLink = LOTES.filter((l) => !CHECKOUT.comumPorLote?.[l.id]);
if (semLink.length === LOTES.length) {
  erro(`nenhum lote tem link proprio: os ${LOTES.length} usam o mesmo checkout`,
       'a hub.la nao muda o preco sozinha — preencha CHECKOUT.comumPorLote com os 4 links');
} else if (semLink.length) {
  erro(`sem link proprio: ${semLink.map((l) => l.id).join(', ')}`,
       'complete CHECKOUT.comumPorLote em config/oferta.mjs');
}

if (!META.pixelId) aviso('Meta Pixel desligado', 'sem ele nao da para otimizar campanha nem medir conversao');
// decisao da Aline: o valor da consulta avulsa nao entra na pagina.
// Nao e pendencia, e escolha — por isso nao vira aviso.

/* ── links de checkout no HTML final ──────────────────────────── */
{
  const html = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const hrefs = [...html.matchAll(/<a[^>]*data-checkout="(\w+)"[^>]*href="([^"]+)"/g)]
    .concat([...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*data-checkout="(\w+)"/g)]
      .map((m) => [m[0], m[2], m[1]]));
  if (!hrefs.length) erro('nenhum link com data-checkout no HTML', '');
  for (const [, qual, href] of hrefs) {
    let u;
    try { u = new URL(href); } catch { erro(`link de checkout invalido: ${href}`, ''); continue; }
    if (!CHECKOUT.hosts.includes(u.hostname.replace(/^www\./, ''))) {
      erro(`checkout "${qual}" aponta para fora da hub.la: ${u.hostname}`, '');
    }
  }
}

/* ── relatório ────────────────────────────────────────────────── */
const linha = (i, x) => {
  console.log(`  ${i}. ${x.m}`);
  if (x.comoResolver) console.log(`     -> ${x.comoResolver}`);
};

console.log('\n  CHECAGEM DE PRE-VOO');
console.log('  ' + '='.repeat(66));
if (erros.length) {
  console.log(`\n  BLOQUEIA PUBLICAR (${erros.length})\n`);
  erros.forEach((x, i) => linha(i + 1, x));
}
if (avisos.length) {
  console.log(`\n  AVISOS (${avisos.length}) — nao impedem publicar\n`);
  avisos.forEach((x, i) => linha(i + 1, x));
}
if (!erros.length) {
  console.log(`\n  ${avisos.length ? 'Nada bloqueia. ' : ''}Pronto para publicar.\n`);
} else {
  console.log('\n  Resolva os itens acima antes de apontar o dominio.\n');
}
process.exit(erros.length ? 1 : 0);
