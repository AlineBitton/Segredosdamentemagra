/**
 * Imprime a URL pronta de cada variante de promessa, com os UTMs no formato
 * que a hub.la recebe. Copiar e colar no gerenciador de anúncios.
 *
 *   npm run urls                    -> público frio, campanha padrão
 *   npm run urls -- morno           -> troca o utm_term
 *   npm run urls -- frio smm-out26  -> troca também a campanha
 */
import { PROMESSAS } from '../config/oferta.mjs';

const SITE = 'https://afinandocorpoemente.com.br';
const publico = process.argv[2] || 'frio';
const campanha = process.argv[3] || 'smm-set26';

const limpar = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

console.log(`\n  campanha: ${campanha}   publico: ${publico}\n`);
// chaves numericas ("93") vao para o inicio no JavaScript; a ordem util e
// a padrao primeiro, depois as demais na ordem em que foram escritas
const ordem = ['padrao', ...Object.keys(PROMESSAS).filter((k) => k !== 'padrao')];

for (const id of ordem) {
  const p = PROMESSAS[id];
  const u = new URL(SITE + '/');
  // p vazio = variante padrao; nao adiciona o parametro
  if (id !== 'padrao') u.searchParams.set('p', id);
  u.searchParams.set('utm_source', 'meta');
  u.searchParams.set('utm_medium', 'paid');
  u.searchParams.set('utm_campaign', campanha);
  u.searchParams.set('utm_term', publico);
  // prefixo "crv-" de proposito: sem ele, um utm_content igual ao nome de uma
  // variante trocaria a promessa sozinho quando o "p" faltasse
  u.searchParams.set('utm_content', `crv-${id}-01`);

  console.log(`  ${id}`);
  console.log(`    ${limpar(p.h1)}`);
  console.log(`    ${u.toString()}\n`);
}
console.log(`  sck que chega na hub.la:  meta|paid|${campanha}|${publico}|crv-<variante>-01\n`);
