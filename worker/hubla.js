/**
 * O aviso de pagamento da Hubla.
 *
 * POR QUE ISTO EXISTE
 *
 * O `Purchase` disparava no carregamento da página pós-compra. Três problemas,
 * todos silenciosos:
 *
 *   1. Marcava quem só ABRIU o endereço, tivesse pago ou não — e marcava de
 *      novo a cada F5.
 *   2. Ia sem valor. Sem `value`, a Meta não calcula retorno: você sabe que
 *      houve venda, não se o criativo trouxe R$27 ou R$97.
 *   3. Ia sem atribuição. A Hubla redireciona para um endereço fixo, então as
 *      UTMs que foram para o checkout não voltam. Sobrava o cookie do
 *      navegador.
 *
 * A Hubla avisa este endereço quando o dinheiro entra de verdade, e nesse
 * aviso vem o valor, o e-mail de quem comprou e o `sck` que a página mandou no
 * link. É esse aviso que vira o `Purchase` — com valor, com atribuição, e só
 * para quem pagou.
 *
 * SEGREDO NO ENDEREÇO
 *
 * A rota é `/hubla/<segredo>`. Sem assinatura para conferir, é o próprio
 * endereço que autentica: quem não o conhece recebe 404 e não descobre que
 * existe rota aqui. Isso importa porque uma rota aberta deixaria qualquer um
 * inventar vendas e envenenar a otimização das campanhas.
 *
 * SEMPRE 200
 *
 * Fora o segredo errado, tudo responde 200 — inclusive o que não deu para
 * entender. A Hubla desliga um webhook que responde erro várias vezes, e um
 * webhook desligado é pior que um evento perdido: para de contar tudo.
 */

import { META } from '../config/oferta.mjs';
import { mandarEvento, montarPessoa } from './meta.js';

/**
 * Sinais de que o dinheiro entrou.
 *
 * A correspondência é solta (`inclui`) e vale tanto para o NOME do aviso
 * quanto para o CAMPO DE STATUS dentro dele. Ser generoso aqui é seguro por
 * um motivo específico: o `event_id` de todo Purchase é o número da transação,
 * então dois avisos sobre a mesma venda — o `payment_succeeded` e o
 * `status_updated` que vem junto — chegam na Meta com o mesmo identificador e
 * contam UMA compra.
 *
 * Sem essa desduplicação, ser generoso dobraria o relatório. Com ela, o risco
 * inverte de lado: o caro é a venda que NÃO é reconhecida, porque some sem
 * erro nenhum aparecer.
 */
const SINAIS_PAGOU = [
  'payment_succeeded', 'paymentsucceeded', 'invoice.paid', 'order.paid',
  'newsale', 'new_sale', 'sale.approved', 'saleapproved',
  'purchase.approved', 'payment.approved',
  // o campo de status, em inglês e em português
  'paid', 'pago', 'approved', 'aprovado', 'succeeded', 'completed',
  'confirmed', 'confirmado',
];

/**
 * O que NUNCA pode virar compra.
 *
 * Conferido ANTES da lista de cima, e a ordem é o ponto: `unpaid` contém
 * `paid`, `payment_refunded` contém `payment`. Invertida, a ordem
 * transformaria estorno em venda — o pior erro possível aqui, porque infla o
 * retorno e faz a campanha escalar em cima de nada.
 */
const SINAIS_PROIBIDOS = [
  'refund', 'reembols', 'chargeback', 'cancel', 'expired', 'expirad',
  'abandon', 'pending', 'aguard', 'waiting', 'failed', 'falho', 'refused',
  'declined', 'dispute', 'unpaid', 'not_paid', 'nao_pago', 'naopago',
];

export async function receberWebhook(request, env, ctx) {
  if (request.method !== 'POST') {
    // `?testar=meta` confere o token da Meta sem esperar uma venda.
    //
    // Até aqui o token só seria exercitado quando a primeira compra de
    // verdade tentasse sair — e um token errado apareceria como uma venda
    // perdida, no pior momento possível. Esta chamada pergunta à Meta se o
    // token vale E se ele enxerga este pixel, sem criar evento nenhum.
    if (new URL(request.url).searchParams.get('testar') === 'meta') {
      return testarTokenDaMeta(env);
    }
    // GET com o segredo certo serve para conferir que o endereço está de pé
    return new Response('ok', { status: 200, headers: { 'cache-control': 'no-store' } });
  }

  let dados;
  const bruto = await request.text();
  try {
    dados = JSON.parse(bruto);
  } catch {
    console.error('HUBLA corpo não é JSON:', bruto.slice(0, 500));
    return ok();
  }

  // O aviso inteiro vai para o log na primeira vez que chegar. É com ele que
  // se confere o nome real de cada campo — nenhuma documentação substitui ver
  // um aviso de verdade. Depois de calibrado, dá para tirar esta linha.
  console.log('HUBLA aviso:', JSON.stringify(dados).slice(0, 2000));

  // O nome do aviso e o campo de status são lidos separados: a Hubla manda
  // "invoice.status_updated" com o status real dentro, e ali é onde o
  // pagamento aparece. Olhar só o nome perderia essa venda.
  const tipo = String(
    procurar(dados, ['type', 'event', 'eventtype', 'event_type']) ?? '',
  ).toLowerCase();
  const situacao = String(
    procurar(dados, ['status', 'state', 'situacao', 'paymentstatus', 'payment_status']) ?? '',
  ).toLowerCase();
  const sinais = `${tipo} ${situacao}`;

  if (SINAIS_PROIBIDOS.some((t) => sinais.includes(t))) {
    console.log(`HUBLA ignorado (não é venda): tipo="${tipo}" status="${situacao}"`);
    return ok();
  }
  if (!SINAIS_PAGOU.some((t) => sinais.includes(t))) {
    // Não reconhecido não vira compra: inventar venda é pior que perder uma.
    // Fica no log, com os dois campos, para entrar na lista acima.
    console.warn(`HUBLA sem sinal de pagamento, nada enviado: tipo="${tipo || '(vazio)'}" status="${situacao || '(vazio)'}"`);
    return ok();
  }
  console.log(`HUBLA reconhecido como venda: tipo="${tipo}" status="${situacao}"`);

  const transacao = procurar(dados, [
    'transactionid', 'transaction_id', 'invoiceid', 'invoice_id',
    'orderid', 'order_id', 'saleid', 'sale_id', 'id',
  ]);
  if (!transacao) {
    console.error('HUBLA sem número de transação — sem ele não dá para desduplicar');
    return ok();
  }

  const evento = {
    event_name: 'Purchase',
    // O número da transação É o identificador do evento. Quando a Hubla
    // reenvia o mesmo aviso — e ela reenvia —, a Meta reconhece e não conta
    // duas vezes.
    event_id: `hubla-${transacao}`,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: env.SITE_URL || undefined,
    user_data: await montarPessoa({
      email: procurar(dados, ['email', 'useremail', 'user_email', 'buyeremail', 'customeremail']),
      telefone: procurar(dados, ['phone', 'telefone', 'userphone', 'user_phone', 'celular']),
    }),
    custom_data: montarCompra(dados, env),
  };

  const enviado = await mandarEvento(env, evento);
  console.log(`HUBLA Purchase ${enviado ? 'enviado' : 'FALHOU'} — transação ${transacao}`);
  return ok();
}

/**
 * Pergunta à Meta se o token vale e se ele alcança este pixel.
 *
 * Lê um campo bobo do próprio conjunto de dados. Se a Meta responde, o token
 * é válido e tem acesso; se recusa, ela diz o motivo — e é essa frase que
 * interessa, não um "falhou" genérico. Nenhum evento é criado.
 */
async function testarTokenDaMeta(env) {
  const texto = (t) => new Response(t, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });

  if (!env.META_CAPI_TOKEN) {
    return texto('META_CAPI_TOKEN: NÃO configurado neste Worker.\n');
  }

  const alvo = `https://graph.facebook.com/${META.capiVersao}/${META.pixelId}` +
    `?fields=name&access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`;

  try {
    const r = await fetch(alvo);
    const corpo = await r.text();
    if (r.ok) {
      return texto(
        'META_CAPI_TOKEN: VÁLIDO\n' +
        `pixel ${META.pixelId} acessível\n` +
        `resposta da Meta: ${corpo.slice(0, 300)}\n\n` +
        'Nenhum evento foi criado por esta conferência.\n',
      );
    }
    return texto(
      `META_CAPI_TOKEN: RECUSADO (HTTP ${r.status})\n\n` +
      `${corpo.slice(0, 600)}\n\n` +
      'Erro 190 costuma ser token inválido ou expirado.\n' +
      'Erro 100 costuma ser token sem acesso a este pixel.\n',
    );
  } catch (e) {
    return texto(`Não deu para falar com a Meta: ${e?.message || e}\n`);
  }
}

/** Valor, moeda e a origem da campanha, que é o que responde "qual criativo vendeu". */
function montarCompra(dados, env) {
  const compra = { currency: 'BRL' };

  const bruto = procurar(dados, [
    'totalamount', 'total_amount', 'amount', 'value', 'totalvalue',
    'total', 'price', 'netvalue', 'net_value',
  ]);
  const numero = Number(String(bruto ?? '').replace(',', '.'));
  if (Number.isFinite(numero) && numero > 0) {
    // A maioria das plataformas brasileiras manda centavos. Se a primeira
    // venda aparecer na Meta cem vezes maior (ou menor), é este ponto: basta
    // ligar a variável HUBLA_VALOR_EM_REAIS no Worker.
    compra.value = env.HUBLA_VALOR_EM_REAIS ? numero : numero / 100;
    console.log(`HUBLA valor bruto ${bruto} → enviado ${compra.value}`);
  } else {
    // Sem valor o Purchase ainda vale a pena: conta a venda e casa a pessoa.
    // Só não dá para calcular retorno.
    console.warn('HUBLA sem valor reconhecido no aviso');
  }

  // O `sck` é o que a página montou com as UTMs e mandou no link do checkout.
  // Voltando aqui, ele é a ponte entre a venda e o criativo que a trouxe.
  const sck = procurar(dados, ['sck', 'src', 'utm', 'tracking', 'utm_content']);
  if (sck) {
    compra.content_name = String(sck).slice(0, 200);
  } else {
    // Venda contada, campanha perdida. Não é erro — é a Hubla não devolvendo
    // o que a página mandou no checkout. Fica alto no log porque é o sintoma
    // de "não sei qual criativo vendeu", que passaria calado.
    console.warn('HUBLA venda SEM campanha no aviso — a atribuição desta venda não vai junto');
  }

  return compra;
}

/**
 * Procura uma chave em qualquer profundidade do aviso.
 *
 * Cada plataforma aninha de um jeito, e a Hubla já mudou o formato entre
 * versões — `event.product.totalAmount` numa, `data.totalAmount` noutra.
 * Procurar pelo nome da chave sobrevive a essas mudanças; um caminho fixo
 * quebraria em silêncio na próxima.
 */
function procurar(objeto, nomes, profundidade = 0) {
  if (!objeto || typeof objeto !== 'object' || profundidade > 6) return undefined;
  const alvos = new Set(nomes);

  for (const [chave, valor] of Object.entries(objeto)) {
    if (valor === null || valor === undefined || valor === '') continue;
    if (typeof valor !== 'object' && alvos.has(chave.toLowerCase())) return valor;
  }
  for (const valor of Object.values(objeto)) {
    if (valor && typeof valor === 'object') {
      const achado = procurar(valor, nomes, profundidade + 1);
      if (achado !== undefined) return achado;
    }
  }
  return undefined;
}

const ok = () => new Response('ok', { status: 200, headers: { 'cache-control': 'no-store' } });
