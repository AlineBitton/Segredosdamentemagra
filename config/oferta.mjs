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
  fuso: 'horário de Brasília',
  horario: null,        // [[PRECISO]] o horário de início — ex.: '20h'
  plataforma: 'O link de acesso é enviado por WhatsApp',
};

/**
 * Lotes do ingresso COMUM.
 * `fim` = último instante em que o lote está ativo (UTC).
 *   Lote Especial …… até 10/09 00:59:59 BRT  →  2026-09-10T03:59:59.999Z
 *   2º lote ………………… até 15/09 23:59:59 BRT  →  2026-09-16T02:59:59.999Z
 *   3º lote ………………… até 22/09 23:59:59 BRT  →  2026-09-23T02:59:59.999Z
 *   Último lote ……… até 25/09 23:59:59 BRT  →  2026-09-26T02:59:59.999Z
 *
 * ⚠️ O 1º lote vai até 1h da manhã do dia 10, conforme definido pela Aline —
 *    é a única virada que não acontece à meia-noite. As outras três viram
 *    00:00. Ver doc 00, §5.
 */
export const LOTES = [
  { id: 'especial', nome: 'Lote Especial', centavos: 2700, fim: '2026-09-10T03:59:59.999Z' },
  { id: 'lote2',    nome: '2º Lote',       centavos: 4700, fim: '2026-09-16T02:59:59.999Z' },
  { id: 'lote3',    nome: '3º Lote',       centavos: 6700, fim: '2026-09-23T02:59:59.999Z' },
  { id: 'lote4',    nome: 'Último Lote',   centavos: 9700, fim: '2026-09-26T02:59:59.999Z' },
];

/** VIP: preço fixo, sem lote. */
export const VIP = {
  id: 'vip',
  nome: 'VIP · Diagnóstico Completo',
  centavos: 19700,
  // Decisão da Aline: o valor da consulta avulsa NÃO entra na página.
  // Deixar em null mantém a linha de ancoragem desligada.
  ancoraAvulsaCentavos: null,
};

/**
 * Suporte por WhatsApp.
 *
 * O numero fica AQUI, nao espalhado pelo HTML: ele aparece em tres botoes
 * (suporte, e os dois do estado encerrado) e errar um deles manda a
 * compradora para o vazio.
 *
 * Formato: so digitos, em padrao internacional.
 *   55 (Brasil) + DDD (2) + numero do assinante (9, comecando por 9) = 13
 */
export const SUPORTE = {
  whatsapp: '5561998449585',
};

/** true se o numero tem cara de celular brasileiro valido. */
export function whatsappValido(n = SUPORTE.whatsapp) {
  return /^55[1-9]\d9\d{8}$/.test(String(n || ''));
}

/** Monta o link do WhatsApp com a mensagem ja escrita. */
export function linkWhatsApp(texto) {
  return `https://wa.me/${SUPORTE.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export const CHECKOUT = {
  // A hub.la NÃO muda o preço sozinha: cada lote tem o seu próprio checkout.
  // O motor troca o link junto com o preço, então página e cobrança nunca
  // divergem. Todos são checkout direto (pay.hub.la), que converte mais que
  // a página de produto.
  comumPorLote: {
    especial: 'https://pay.hub.la/b4A2LaNKsKbREw7QRHQs',  // R$27
    lote2:    'https://pay.hub.la/wMASUevrR6GHnmQbZebx',  // R$47
    lote3:    'https://pay.hub.la/z4k0h48mWz6aC1PD7nO5',  // R$67
    lote4:    'https://pay.hub.la/dpK8mM9W1QylMVFmwcj1',  // R$97
  },
  // usado só se algum lote ficar sem link próprio
  comum: 'https://pay.hub.la/b4A2LaNKsKbREw7QRHQs',
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
    sub: 'Emagrecer, muita gente já conseguiu. Ficar é outra conversa — e é sobre ela que a gente vai passar três noites juntas.',
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

/**
 * Parâmetros que podem ser repassados para o checkout.
 *
 * ATENÇÃO — isto é uma medida de segurança, não uma otimização.
 * O script original repassava TODOS os parâmetros da URL. Como o destino é uma
 * página de pagamento, isso permitia que qualquer pessoa montasse e
 * compartilhasse um link como
 *
 *     /?cupom=GRATIS&email=vitima@exemplo.com
 *
 * e esses valores chegariam intactos ao checkout. Se a plataforma honrar
 * qualquer um deles, vira desconto indevido ou compra no nome de outra pessoa.
 *
 * Passam apenas: qualquer utm_*, os identificadores de clique das redes, e os
 * parâmetros de afiliado que a hub.la usa. Tudo o mais é descartado.
 */
const PARAMS_EXATOS = new Set([
  'sck', 'src', 'ref', 'xcod', 'aff', 'affiliate',
  'fbclid', 'gclid', 'ttclid', 'msclkid', 'twclid', 'li_fat_id', 'epik', 'igshid',
]);

export function paramPermitido(chave) {
  const k = String(chave).toLowerCase();
  return k.startsWith('utm_') || PARAMS_EXATOS.has(k);
}

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

/**
 * Prazo do lote por extenso, em horário de Brasília. O contador que fica
 * girando é útil para quem vê; para quem usa leitor de tela, "5d 09h 19m 52s"
 * é críptico. Esta frase entra escondida ao lado dele.
 */
export function prazoTexto(agora = Date.now()) {
  const l = loteAtivo(agora);
  if (!l.fim) return 'As inscrições estão encerradas.';
  const d = new Date(Date.parse(l.fim));
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long',
  }).format(d);
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
  }).format(d).replace(':', 'h');
  return `O ${l.nome} termina em ${data}, às ${hora}, no horário de Brasília.`;
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
