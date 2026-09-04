/**
 * Cloudflare Pages Function — roda na borda, antes de a página chegar no
 * navegador. Faz três coisas, todas via HTMLRewriter (streaming, custo ~0ms):
 *
 *   1. LOTE — decide o preço vigente pelo relógio da Cloudflare, não pelo do
 *      celular da compradora. Um relógio errado no cliente mostraria R$27 e a
 *      hub.la cobraria R$47: fricção, suporte e chargeback.
 *   2. TROCA DE PROMESSA — troca H1 e subtítulo conforme ?p= (ou utm_content),
 *      antes da primeira pintura. Zero flash, zero CLS, zero JavaScript.
 *   3. UTM — propaga os parâmetros da campanha para os links da hub.la e monta
 *      o `sck`. Feito aqui, funciona até com JavaScript desligado.
 *
 * O HTML estático já vem com valores de fallback preenchidos no build, então
 * se esta função falhar a página continua correta — só congelada no lote que
 * era o vigente quando o build rodou.
 */

import {
  CHECKOUT,
  UTM_KEYS,
  VIP,
  brl,
  checkoutComum,
  contadorTexto,
  escolherPromessa,
  prazoTexto,
  loteAtivo,
  proximoLote,
  segundosAteVirada,
} from '../config/oferta.mjs';

const TETO_CACHE_S = 300;

export const onRequest = async (context) => {
  const { request, next } = context;
  const resposta = await next();

  const tipo = resposta.headers.get('content-type') || '';
  if (!tipo.includes('text/html')) return resposta;

  const url = new URL(request.url);
  const agora = Date.now();
  const lote = loteAtivo(agora);
  const proximo = proximoLote(agora);
  const promessa = escolherPromessa(url.searchParams);
  const encerrado = lote.id === 'encerrado';

  const textos = {
    'lote-nome': lote.nome,
    'preco-comum': encerrado ? '—' : brl(lote.centavos),
    'preco-comum-numero': encerrado ? '—' : String(lote.centavos / 100),
    'preco-proximo': proximo ? brl(proximo.centavos) : '',
    'preco-vip': brl(VIP.centavos),
    'promessa-sub': promessa.sub,
    'prazo-extenso': prazoTexto(agora),
  };
  if (VIP.ancoraAvulsaCentavos && lote.centavos != null) {
    textos['ancora-vip'] =
      `O Diagnóstico dos 5 Corpos, avulso, custa ${brl(VIP.ancoraAvulsaCentavos)}. ` +
      `Aqui ele entra por ${brl(VIP.centavos - lote.centavos)} a mais.`;
  }

  const hrefs = {
    comum: comQueryDaCampanha(checkoutComum(lote), url),
    vip: comQueryDaCampanha(CHECKOUT.vip, url),
  };

  const rw = new HTMLRewriter()
    // ganchos de CSS/JS no <html>
    .on('html', {
      element(el) {
        el.setAttribute('data-lote', lote.id);
        el.setAttribute('data-promessa', promessa.id);
        if (encerrado) el.setAttribute('data-encerrado', '');
      },
    })
    // H1 é o único slot que aceita marcação (o <em> da ênfase)
    .on('[data-slot="promessa-h1"]', {
      element(el) {
        el.setInnerContent(promessa.h1, { html: true });
      },
    })
    // demais slots: texto puro, escapado pelo próprio HTMLRewriter
    .on('[data-slot]', {
      element(el) {
        const nome = el.getAttribute('data-slot');
        if (nome in textos) el.setInnerContent(textos[nome]);
      },
    })
    // prazo do contador — o cliente só conta, nunca decide preço
    .on('[data-deadline]', {
      element(el) {
        el.setAttribute('data-deadline', lote.fim || '');
      },
    })
    // valor inicial do contador: a página já nasce com o tempo certo, sem
    // travessão piscando antes do JavaScript e funcionando sem ele
    .on('[data-cd]', {
      element(el) {
        el.setInnerContent(contadorTexto(agora));
      },
    })
    // links de checkout, já com UTM e sck
    .on('a[data-checkout]', {
      element(el) {
        const qual = el.getAttribute('data-checkout');
        if (hrefs[qual]) el.setAttribute('href', hrefs[qual]);
      },
    })
    // metadados sociais acompanham o preço vigente
    .on('meta[property="og:description"], meta[name="description"]', {
      element(el) {
        const base = el.getAttribute('content') || '';
        if (!encerrado) el.setAttribute('content', base.replace(/R\$\s?\d+/, brl(lote.centavos)));
      },
    });

  const saida = rw.transform(resposta);
  const cabecalhos = new Headers(saida.headers);

  const ttl = Math.min(TETO_CACHE_S, Math.max(30, segundosAteVirada(agora)));
  cabecalhos.set('cache-control', `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=30`);
  cabecalhos.set('x-content-type-options', 'nosniff');
  cabecalhos.set('referrer-policy', 'strict-origin-when-cross-origin');
  cabecalhos.set('permissions-policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()');
  cabecalhos.set('x-lote', lote.id);

  return new Response(saida.body, { status: saida.status, headers: cabecalhos });
};

/**
 * Copia os parâmetros da campanha para o link da hub.la e monta o `sck`
 * (os 5 UTMs concatenados por "|"), sem sobrescrever nada que o link já traga.
 */
function comQueryDaCampanha(destino, urlDaPagina) {
  let alvo;
  try {
    alvo = new URL(destino);
  } catch {
    return destino;
  }
  const host = alvo.hostname.replace(/^www\./, '');
  if (!CHECKOUT.hosts.includes(host)) return destino;

  const entrada = urlDaPagina.searchParams;
  for (const [chave, valor] of entrada) {
    if (chave === 'p') continue; // 'p' é nosso, não da hub.la
    if (!alvo.searchParams.has(chave)) alvo.searchParams.set(chave, valor);
  }

  const valores = UTM_KEYS.map((k) => entrada.get(k) || '');
  if (valores.some(Boolean) && !alvo.searchParams.has('sck')) {
    alvo.searchParams.set('sck', valores.join('|'));
  }
  return alvo.toString();
}
