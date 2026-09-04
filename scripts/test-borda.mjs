/**
 * Teste de integracao da funcao de borda.
 *
 * Os testes unitarios (test-lotes.mjs) provam a matematica dos lotes.
 * Este prova a FIACAO: que a borda de fato reescreve o HTML, troca a
 * promessa, propaga UTM nos links de checkout e devolve os cabecalhos certos.
 *
 * Requer o servidor local: npm run dev
 */
import { loteAtivo, brl, VIP, PROMESSAS } from '../config/oferta.mjs';

const BASE = process.env.BORDA || 'http://127.0.0.1:8788';
let falhas = 0;

const ok = (cond, msg, detalhe = '') => {
  console.log(`${cond ? '  ok   ' : ' FALHA '} ${msg}${detalhe && !cond ? `\n         ${detalhe}` : ''}`);
  if (!cond) falhas++;
};

const pegar = async (query = '') => {
  const r = await fetch(BASE + '/' + query);
  return { html: await r.text(), h: r.headers, status: r.status };
};

/** Extrai os href dos links de checkout do HTML. */
const checkouts = (html, qual) =>
  [...html.matchAll(new RegExp(`<a[^>]*data-checkout="${qual}"[^>]*>`, 'g'))]
    .map((m) => (m[0].match(/href="([^"]*)"/) || [])[1])
    .filter(Boolean);

const lote = loteAtivo();

console.log('\n── resposta base ───────────────────────────────────────────');
{
  const { html, h, status } = await pegar();
  ok(status === 200, `HTTP 200 (recebido ${status})`);
  ok(h.get('x-lote') === lote.id, `cabecalho x-lote = "${lote.id}"`, `recebido "${h.get('x-lote')}"`);
  const cc = h.get('cache-control') || '';
  ok(/s-maxage=\d+/.test(cc), 'cache-control traz s-maxage', cc);
  ok(cc.includes('max-age=0'), 'cache-control impede cache no navegador', cc);
  ok(h.get('x-content-type-options') === 'nosniff', 'x-content-type-options: nosniff');
  ok(/referrer-policy/i.test([...h.keys()].join(' ')), 'referrer-policy presente');
  ok(html.includes(`data-lote="${lote.id}"`), `<html data-lote="${lote.id}">`);
  ok(html.includes('data-promessa="padrao"'), '<html data-promessa="padrao"> sem parametro');
  ok(html.includes(brl(lote.centavos)), `preco do lote vigente (${brl(lote.centavos)}) no HTML`);
  ok(html.includes(brl(VIP.centavos)), `preco do VIP (${brl(VIP.centavos)}) no HTML`);
  ok(html.includes(lote.fim), 'prazo do contador injetado');
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  ok(h1.includes('balan'), 'H1 e a promessa padrao', h1.slice(0, 70));
}

console.log('\n── troca de promessa ───────────────────────────────────────');
for (const id of ['edepois', '93', 'bariatrica', 'divisao']) {
  const { html } = await pegar(`?p=${id}`);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  const esperado = PROMESSAS[id].h1.replace(/<[^>]+>/g, '').slice(0, 24);
  const sub = (html.match(/data-slot="promessa-sub"[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '';
  ok(html.includes(`data-promessa="${id}"`) && h1.replace(/<[^>]+>/g, '').includes(esperado),
     `?p=${id} troca o H1`, h1.slice(0, 80));
  ok(sub.trim().startsWith(PROMESSAS[id].sub.slice(0, 22)), `?p=${id} troca o subtitulo`, sub.slice(0, 70));
}
{
  const { html } = await pegar('?p=nao-existe');
  ok(html.includes('data-promessa="padrao"'), 'variante invalida cai no padrao');
  const { html: h2 } = await pegar('?utm_content=93');
  ok(h2.includes('data-promessa="93"'), 'utm_content tambem seleciona a variante');
  const { html: h3 } = await pegar('?p=EDEPOIS');
  ok(h3.includes('data-promessa="edepois"'), 'caixa alta e normalizada');
}

console.log('\n── propagacao de UTM nos links de checkout ─────────────────');
{
  const q = '?utm_source=meta&utm_medium=cpc&utm_campaign=smm25&utm_term=frio&utm_content=edepois&fbclid=abc';
  const { html } = await pegar(q);
  const comuns = checkouts(html, 'comum');
  const vips = checkouts(html, 'vip');
  ok(comuns.length > 0, `links do Comum encontrados (${comuns.length})`);
  ok(vips.length > 0, `links do VIP encontrados (${vips.length})`);

  const u = new URL(comuns[0]);
  ok(u.hostname.endsWith('hub.la'), 'checkout aponta para a hub.la', u.hostname);
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    ok(u.searchParams.get(k) === q.match(new RegExp(`${k}=([^&]*)`))[1], `${k} propagado`);
  }
  ok(u.searchParams.get('sck') === 'meta|cpc|smm25|frio|edepois', 'sck montado com os 5 UTMs',
     u.searchParams.get('sck'));
  ok(u.searchParams.get('fbclid') === 'abc', 'parametros extras tambem passam (fbclid)');
  ok(!u.searchParams.has('p'), 'o parametro "p" NAO vaza para a hub.la');
  ok(new Set(comuns).size === 1, 'todos os links do Comum apontam para a mesma URL');

  const v = new URL(vips[0]);
  ok(v.hostname === 'pay.hub.la', 'VIP usa checkout direto (pay.hub.la)', v.hostname);
  ok(v.searchParams.get('sck') === 'meta|cpc|smm25|frio|edepois', 'sck tambem no VIP');
}

console.log('\n── sem UTM nenhum ──────────────────────────────────────────');
{
  const { html } = await pegar();
  const u = new URL(checkouts(html, 'comum')[0]);
  ok(!u.searchParams.has('sck'), 'sem UTM, nao inventa sck');
  ok([...u.searchParams.keys()].length === 0, 'link limpo quando nao ha campanha');
}

console.log('\n── estaticos passam intactos ───────────────────────────────');
{
  const r = await fetch(BASE + '/fonts/inter-var.woff2');
  ok(r.status === 200 && r.headers.get('content-type')?.includes('font'),
     'fonte servida sem passar pelo reescritor', `${r.status} ${r.headers.get('content-type')}`);
  const i = await fetch(BASE + '/img/provas/01-400.avif');
  ok(i.status === 200, 'imagem de prova social servida');
}

console.log(`\n${falhas === 0 ? '  ✔ borda funcionando ponta a ponta' : `  ✘ ${falhas} falha(s)`}\n`);
process.exit(falhas === 0 ? 0 : 1);
