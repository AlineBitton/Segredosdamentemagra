/**
 * O envio de eventos para a Conversion API da Meta.
 *
 * Dois lugares mandam evento: a página pós-compra (relato do navegador
 * espelhado no servidor) e o webhook da Hubla (relato do pagamento de
 * verdade). Os dois passam por aqui, para que o formato do evento, o
 * tratamento de erro e a versão da API existam num lugar só.
 *
 * Nada aqui derruba quem chamou. Um erro de relatório não pode virar erro de
 * tela para quem acabou de pagar, nem resposta de erro para a Hubla — que
 * desligaria o webhook depois de algumas tentativas.
 */

import { META } from '../config/oferta.mjs';

/**
 * Manda UM evento para a Meta.
 *
 * `eventId` é o que faz a desduplicação: dois relatos do mesmo fato com o
 * mesmo identificador contam uma vez só. Por isso o webhook usa o número da
 * transação da Hubla — se a Hubla reenviar o mesmo aviso (e ela reenvia,
 * quando não recebe 200), a Meta reconhece e não conta de novo.
 *
 * Devolve `true` se a Meta aceitou, `false` em qualquer outro caso.
 */
export async function mandarEvento(env, evento) {
  const token = env.META_CAPI_TOKEN;
  if (!token || !META.pixelId) return false;

  const corpo = {
    data: [evento],
    access_token: token,
    // Só quando estiver conferindo em Gerenciador de Eventos → Testar eventos.
    // Com este código preenchido a compra NÃO entra nos relatórios de verdade,
    // então ele nunca deve ficar ligado em produção.
    ...(env.META_CAPI_TEST_CODE ? { test_event_code: env.META_CAPI_TEST_CODE } : {}),
  };

  const alvo = `https://graph.facebook.com/${META.capiVersao}/${META.pixelId}/events`;

  try {
    const r = await fetch(alvo, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    if (!r.ok) {
      // aparece em `npx wrangler tail`
      console.error('CAPI', r.status, (await r.text()).slice(0, 400));
      return false;
    }
    return true;
  } catch (e) {
    console.error('CAPI falhou:', e?.message || e);
    return false;
  }
}

/**
 * Monta o bloco `user_data` — o que a Meta usa para reconhecer a pessoa.
 *
 * E-mail e telefone vão com hash SHA-256, como a Meta exige: o dado em claro
 * nunca sai daqui. São eles que dão o melhor casamento com quem clicou no
 * anúncio; sem eles sobra só cookie e IP, que perdem muita gente.
 */
export async function montarPessoa({ email, telefone, ip, agente, fbp, fbc }) {
  const pessoa = {
    client_ip_address: ip || undefined,
    client_user_agent: agente || undefined,
    fbp: fbp || undefined,
    fbc: fbc || undefined,
  };

  const em = normalizarEmail(email);
  if (em) pessoa.em = [await sha256Hex(em)];

  const ph = normalizarTelefone(telefone);
  if (ph) pessoa.ph = [await sha256Hex(ph)];

  return pessoa;
}

/** Minúsculas e sem espaços em volta — a normalização que a Meta manda fazer. */
function normalizarEmail(valor) {
  const s = String(valor ?? '').trim().toLowerCase();
  return s.includes('@') ? s : '';
}

/**
 * Só dígitos, com código do país.
 *
 * A Meta compara o número inteiro, então `11 91234-5678` e `+55 11 91234-5678`
 * seriam duas pessoas diferentes. Número brasileiro sem o 55 na frente ganha o
 * 55 aqui; qualquer outro tamanho vai como está, porque chutar código de país
 * errado é pior que não mandar.
 */
function normalizarTelefone(valor) {
  const d = String(valor ?? '').replace(/\D/g, '');
  if (d.length < 8) return '';
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

/** SHA-256 em hexadecimal — o formato que a Meta espera nos campos com hash. */
async function sha256Hex(texto) {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
