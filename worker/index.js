/**
 * O Worker inteiro do site. Roda na borda, antes de a página chegar no
 * navegador, e faz três coisas por HTMLRewriter (streaming, custo ~0ms):
 *
 *   1. LOTE — decide o preço vigente pelo relógio da Cloudflare, não pelo do
 *      celular da compradora. Um relógio errado no cliente mostraria R$27 e a
 *      hub.la cobraria R$47: fricção, suporte e chargeback.
 *   2. TROCA DE PROMESSA — troca o gancho e o subtítulo conforme ?p= (ou
 *      utm_content), antes da primeira pintura. Zero flash, zero CLS, zero JS.
 *   3. UTM — propaga os parâmetros da campanha para os links da hub.la e monta
 *      o `sck`. Feito aqui, funciona até com JavaScript desligado.
 *
 * O HTML estático já vem com valores de fallback preenchidos no build, então
 * se esta função falhar a página continua correta — só congelada no lote que
 * era o vigente quando o build rodou.
 *
 * Este mesmo arquivo serve aos dois caminhos de publicação: é o `main` do
 * Worker no deploy conectado ao GitHub, e vira o `_worker.js` do modo avançado
 * do Pages quando o zip é montado por `npm run pacote`. Nos dois, os estáticos
 * saem de `env.ASSETS`.
 */

import {
  CHECKOUT,
  UTM_KEYS,
  VIP,
  brl,
  checkoutComum,
  contadorTexto,
  escolherPromessa,
  loteAtivo,
  PAGINA_POS_COMPRA,
  paramPermitido,
  prazoData,
  prazoTexto,
  proximoAviso,
  proximoLote,
  segundosAteVirada,
} from '../config/oferta.mjs';
import { receberWebhook } from './hubla.js';
import { mandarEvento, montarPessoa } from './meta.js';

const TETO_CACHE_S = 300;

// `/nos-vemos-no-evento`, com ou sem `.html`, com ou sem barra final, e também
// sob o prefixo de SMM_BASE
const CAMINHO_POS_COMPRA = new RegExp(
  `/${PAGINA_POS_COMPRA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\.html)?/?$`,
);

async function servir(request, env, ctx) {
  // O aviso de pagamento da Hubla vem antes de qualquer coisa: não é página,
  // não passa por ASSETS e não pode ser cacheado. O segredo está no próprio
  // endereço — sem ele, 404, e quem não conhece a rota não descobre que ela
  // existe.
  const segredo = env.HUBLA_WEBHOOK_SECRET;
  if (segredo && new URL(request.url).pathname === `/hubla/${segredo}`) {
    return receberWebhook(request, env, ctx);
  }

  // os arquivos estáticos vêm do próprio Worker, pela ligação ASSETS, e
  // continuam passando pelo _headers (CSP, cache das fontes e das imagens)
  const resposta = await env.ASSETS.fetch(request);

  const tipo = resposta.headers.get('content-type') || '';
  if (!tipo.includes('text/html')) return resposta;

  const url = new URL(request.url);
  const agora = Date.now();
  // o endereço vem do config, junto com o build — quando ele mudou e só o
  // build acompanhou, a borda ficou olhando para uma página que não existia
  // mais e a compra deixou de ser relatada, sem erro nenhum aparecer
  const ehPosCompra = CAMINHO_POS_COMPRA.test(url.pathname);
  // O `Purchase` da página marca quem ABRIU o endereço, não quem pagou, e vai
  // sem valor. Quando o webhook da Hubla assume — ligando PURCHASE_PELO_WEBHOOK
  // no Worker —, este some: o atributo não é escrito e o script da página não
  // dispara nada. Sem isso os dois marcariam a mesma venda.
  const marcaNaPagina = ehPosCompra && !env.PURCHASE_PELO_WEBHOOK;
  // O mesmo identificador vai no navegador e no servidor. É ele que faz a
  // Meta entender os dois relatos como UMA compra, e não duas.
  const eventoId = marcaNaPagina ? crypto.randomUUID() : '';
  const lote = loteAtivo(agora);
  const proximo = proximoLote(agora);
  const promessa = escolherPromessa(url.searchParams);
  const encerrado = lote.id === 'encerrado';

  const textos = {
    'lote-nome': lote.nome,
    'preco-comum': encerrado ? '—' : brl(lote.centavos),
    'preco-comum-numero': encerrado ? '—' : String(lote.centavos / 100),
    'preco-proximo': proximo ? brl(proximo.centavos) : '',
    'proximo-aviso': proximoAviso(agora),
    'preco-vip': brl(VIP.centavos),
    'promessa-sub': promessa.sub,
    'prazo-data': prazoData(agora),
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
        // o pixel do navegador lê daqui para casar com o evento do servidor
        if (eventoId) el.setAttribute('data-evento-id', eventoId);
      },
    })
    // a linha do gancho é o único slot que aceita marcação (o <em> da
    // ênfase). Vazia na variante A, onde o logotipo fala sozinho: o
    // :empty do CSS recolhe o parágrafo sem deixar buraco.
    .on('[data-slot="promessa-linha2"]', {
      element(el) {
        el.setInnerContent(promessa.linha2 || '', { html: true });
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

  if (ehPosCompra) {
    // Nunca cachear a página de agradecimento. Ela carrega um `event_id`
    // único por visita; servida do cache, várias compradoras receberiam o
    // mesmo identificador e a Meta juntaria todas as compras numa só.
    cabecalhos.set('cache-control', 'no-store');
  } else {
    const ttl = Math.min(TETO_CACHE_S, Math.max(30, segundosAteVirada(agora)));
    cabecalhos.set('cache-control', `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=30`);
  }
  cabecalhos.set('x-content-type-options', 'nosniff');
  cabecalhos.set('referrer-policy', 'strict-origin-when-cross-origin');
  cabecalhos.set('permissions-policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()');
  cabecalhos.set('x-lote', lote.id);

  if (marcaNaPagina && saida.status === 200) {
    // a resposta sai na hora; a conversa com a Meta continua depois dela
    const envio = enviarCapi(request, url, env, eventoId);
    if (ctx?.waitUntil) ctx.waitUntil(envio);
    else await envio;
  }

  return new Response(saida.body, { status: saida.status, headers: cabecalhos });
}

export default { fetch: servir };

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
    // lista de permissão, não lista de bloqueio: o destino é uma página de
    // pagamento, e repassar parâmetro arbitrário para lá deixa qualquer pessoa
    // montar um link que altera o checkout. Ver PARAMS_EXATOS em config.
    if (!paramPermitido(chave)) continue;
    if (!alvo.searchParams.has(chave)) alvo.searchParams.set(chave, valor);
  }

  const valores = UTM_KEYS.map((k) => entrada.get(k) || '');
  if (valores.some(Boolean) && !alvo.searchParams.has('sck')) {
    alvo.searchParams.set('sck', valores.join('|'));
  }
  return alvo.toString();
}

/**
 * O espelho, pelo servidor, do `Purchase` que a página dispara.
 *
 * O pixel do navegador falha em silêncio: bloqueador de anúncio, Safari com
 * prevenção de rastreio, aba fechada antes de o `fbevents.js` carregar. A
 * compra aconteceu, a campanha não recebe o crédito, e o algoritmo otimiza no
 * escuro. Este envio sai da borda e não depende de nada no navegador.
 *
 * Os dois carregam o MESMO `event_id`, então a Meta conta uma compra só.
 *
 * Isto é a rede de segurança do relato da PÁGINA, com as limitações dela: sem
 * valor e sem saber se quem abriu chegou a pagar. O relato bom é o do webhook
 * da Hubla, em `hubla.js` — quando ele assume, esta função deixa de ser
 * chamada.
 */
async function enviarCapi(request, url, env, eventoId) {
  if (!env.META_CAPI_TOKEN || !eventoId) return;

  const cookies = lerCookies(request.headers.get('cookie'));
  const fbclid = url.searchParams.get('fbclid');

  await mandarEvento(env, {
    event_name: 'Purchase',
    event_id: eventoId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: url.href,
    action_source: 'website',
    // Sem e-mail nem telefone: a página de agradecimento não conhece a
    // compradora. Quem conhece é a Hubla, e é por isso que o webhook casa
    // muito melhor do que isto aqui.
    user_data: await montarPessoa({
      ip: request.headers.get('cf-connecting-ip'),
      agente: request.headers.get('user-agent'),
      fbp: cookies._fbp,
      // sem o cookie, o clique ainda dá para reconstruir a partir do fbclid
      fbc: cookies._fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : ''),
    }),
    custom_data: { currency: 'BRL', content_category: 'Imersao Segredos da Mente Magra' },
  });
}

/** Lê o cabeçalho Cookie num objeto. Só o que o pixel da Meta grava interessa. */
function lerCookies(cabecalho) {
  const fora = {};
  if (!cabecalho) return fora;
  for (const parte of cabecalho.split(';')) {
    const i = parte.indexOf('=');
    if (i < 1) continue;
    fora[parte.slice(0, i).trim()] = parte.slice(i + 1).trim();
  }
  return fora;
}
