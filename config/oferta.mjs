/**
 * FONTE ÚNICA DA VERDADE DA OFERTA.
 * Alterado aqui, muda na borda, no build e no contador ao mesmo tempo.
 *
 * Fusos: o Brasil não tem horário de verão desde 2019, então America/Sao_Paulo
 * é UTC-3 o ano inteiro. Ainda assim, as fronteiras estão gravadas em UTC
 * absoluto — assim não existe nenhuma conversão de fuso em tempo de execução,
 * nem na borda nem no navegador. `scripts/test-lotes.mjs` prova a equivalência.
 */

export const EVENTO = {
  nome: 'Imersão Segredos da Mente Magra',
  datas: '25, 26 e 27 de setembro',
  ano: 2026,
  horario: null,        // [[PRECISO]] ex.: '20h (horário de Brasília)'
  plataforma: null,     // [[PRECISO]] ex.: 'Zoom'
};

/**
 * Lotes do ingresso COMUM.
 * `fim` = último instante em que o lote está ativo (UTC).
 *   Lote Especial …… até 09/09 23:59:59 BRT  →  2026-09-10T02:59:59.999Z
 *   2º lote ………………… até 15/09 23:59:59 BRT  →  2026-09-16T02:59:59.999Z
 *   3º lote ………………… até 22/09 23:59:59 BRT  →  2026-09-23T02:59:59.999Z
 *   Último lote ……… até 25/09 23:59:59 BRT  →  2026-09-26T02:59:59.999Z
 */
export const LOTES = [
  { id: 'especial', nome: 'Lote Especial', centavos: 2700, fim: '2026-09-10T02:59:59.999Z' },
  { id: 'lote2',    nome: '2º Lote',       centavos: 4700, fim: '2026-09-16T02:59:59.999Z' },
  { id: 'lote3',    nome: '3º Lote',       centavos: 6700, fim: '2026-09-23T02:59:59.999Z' },
  { id: 'lote4',    nome: 'Último Lote',   centavos: 9700, fim: '2026-09-26T02:59:59.999Z' },
];

/** VIP: preço fixo, sem lote. */
export const VIP = {
  id: 'vip',
  nome: 'VIP · Diagnóstico dos 5 Corpos',
  centavos: 19700,
  // [[PRECISO]] valor da consulta avulsa de 50 min — usado na âncora de preço.
  ancoraAvulsaCentavos: null,
};

export const CHECKOUT = {
  // [[CONFIRMAR]] o link do Comum muda de preço sozinho na hub.la por lote?
  // Se existir um link por lote, preencher `porLote` e o motor passa a usá-lo.
  comum: 'https://hub.la/g/EsOXcCvHKYCeq0J2t5Zk',
  comumPorLote: { especial: null, lote2: null, lote3: null, lote4: null },
  // Checkout direto converte mais que a página de produto.
  vip: 'https://pay.hub.la/tdO52QluixGZPMu0Oqt7',
  vipFallback: 'https://hub.la/g/8uuaLE8FfUWJC4d2rn4t',
  // Hosts cujos links recebem propagação de UTM + sck.
  hosts: ['pay.hub.la', 'invoice.hub.la', 'app.hub.la', 'hub.la'],
};

/** Estado servido depois que o último lote termina. */
export const ENCERRADO = {
  id: 'encerrado',
  nome: 'Inscrições encerradas',
  centavos: null,
  fim: null,
};

/**
 * Troca de promessa. Só H1 e subtítulo mudam; o resto da página é idêntico.
 * `h1` aceita <em> para a ênfase tipográfica. Nada mais.
 */
export const PROMESSAS = {
  padrao: {
    h1: 'O que fez a balança descer <em>não é</em> o que faz ela ficar.',
    sub: 'Em 3 dias, você vai entender por que o corpo volta ao ponto de partida mesmo quando o método funcionou — e o que precisa acontecer para a mudança passar a ser sua.',
  },
  divisao: {
    h1: 'A caneta está mudando o seu corpo. <em>Quem está trabalhando</em> para o seu cérebro acompanhar?',
    sub: 'Ela faz o trabalho dela, e faz bem. Existe um segundo trabalho — e ele está sem dono. São 3 dias para assumir esse.',
  },
  '93': {
    h1: 'Você está tentando resolver com <em>7%</em> o que é decidido em <em>93%</em>.',
    sub: 'Não é falta de disciplina. É proporção. 3 dias para trabalhar onde a decisão realmente acontece.',
  },
  bariatrica: {
    h1: 'A cirurgia diminuiu o seu estômago. <em>Ela não mexeu no padrão.</em>',
    sub: 'Em 3 dias, você vai entender por que o corpo volta ao ponto de partida mesmo depois de uma intervenção que funcionou.',
  },
  sanfona: {
    h1: 'A balança desce. E seis meses depois, <em>volta</em>.',
    sub: 'Não é falta de disciplina. É que o trabalho foi feito em uma ponta só. 3 dias para trabalhar as três.',
  },
  balanca: {
    h1: 'Você sobe na balança <em>pra confirmar que ainda tá lá</em>.',
    sub: 'Todo dia. Descalça. Antes de beber água. 3 dias para trocar a vigilância por outra coisa: saber o que fazer quando o número sobe.',
  },
  roupa: {
    h1: 'Você tem três tamanhos no armário e <em>não consegue doar nenhum</em>.',
    sub: 'O que você faz com a roupa que não serve mais diz mais sobre o seu processo do que a balança. 3 dias para entender por quê.',
  },
  '40mais': {
    h1: 'Depois dos 40, o seu corpo mudou as regras. <em>E ninguém te avisou.</em>',
    sub: '3 dias para parar de aplicar hoje um método que já não servia há dez anos.',
  },
  edepois: {
    h1: '<em>“E quando eu parar?”</em>',
    sub: 'Você já levou essa pergunta para o consultório e voltou com ela inteira. A resposta não está na dose — está no que você construiu por baixo do resultado. 3 dias, e no VIP, 50 minutos só seus para olhar isso de perto.',
  },
};

/** Meta Pixel. Enquanto for null, nenhum script de rastreio entra na pagina. */
export const META = {
  pixelId: null,   // [[PRECISO]] ex.: '1234567890123456'
};

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

/* ───────────────────────── motor ───────────────────────── */

/** Lote ativo no instante `agora` (ms epoch). Nunca retorna null. */
export function loteAtivo(agora = Date.now()) {
  for (const l of LOTES) if (agora <= Date.parse(l.fim)) return l;
  return ENCERRADO;
}

/** Lote seguinte ao ativo, ou null se o ativo for o último. */
export function proximoLote(agora = Date.now()) {
  const i = LOTES.findIndex((l) => agora <= Date.parse(l.fim));
  return i === -1 || i === LOTES.length - 1 ? null : LOTES[i + 1];
}

/** Segundos até a próxima virada de lote. Infinity depois do último. */
export function segundosAteVirada(agora = Date.now()) {
  const l = loteAtivo(agora);
  if (!l.fim) return Infinity;
  return Math.max(0, Math.ceil((Date.parse(l.fim) + 1 - agora) / 1000));
}

/** 2700 → "R$ 27" · 19700 → "R$ 197" · quebra centavos só quando existem. */
export function brl(centavos) {
  if (centavos == null) return '';
  const temCentavos = centavos % 100 !== 0;
  return (
    'R$ ' +
    (centavos / 100)
      .toFixed(temCentavos ? 2 : 0)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

/**
 * Texto do contador no instante `agora`. Usado no build e na borda para que a
 * página já nasça com o tempo certo — sem travessão piscando antes do
 * JavaScript, e funcionando mesmo com JavaScript desligado.
 */
export function contadorTexto(agora = Date.now()) {
  const l = loteAtivo(agora);
  if (!l.fim) return 'encerrado';
  const s = Math.max(0, Math.floor((Date.parse(l.fim) + 1 - agora) / 1000));
  const dd = (n) => String(n).padStart(2, '0');
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return d > 0 ? `${d}d ${dd(h)}h ${dd(m)}m ${dd(seg)}s` : `${dd(h)}h ${dd(m)}m ${dd(seg)}s`;
}

/** Variante de promessa a partir dos parâmetros da URL. Sempre válida. */
export function escolherPromessa(params) {
  const bruto = (params.get('p') || params.get('utm_content') || '')
    .toLowerCase()
    .trim();
  return PROMESSAS[bruto] ? { id: bruto, ...PROMESSAS[bruto] } : { id: 'padrao', ...PROMESSAS.padrao };
}

/** URL de checkout do Comum para o lote dado (respeita override por lote). */
export function checkoutComum(lote) {
  return CHECKOUT.comumPorLote?.[lote.id] || CHECKOUT.comum;
}
