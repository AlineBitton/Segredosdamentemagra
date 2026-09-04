/**
 * ~2 KB, inline no fim do body.
 *
 * REGRA: este arquivo NUNCA decide preço nem lote. Isso é da função de borda,
 * que usa o relógio da Cloudflare. Aqui só se conta o tempo que falta — se o
 * relógio da visitante estiver errado, o contador fica errado, mas o preço e o
 * checkout continuam certos.
 */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── contador ────────────────────────────────────────────── */
  (function contador() {
    const alvo = $('[data-deadline]');
    const saidas = $$('[data-cd]');   // a página tem 3: hero, oferta e rodapé da oferta
    if (!alvo || !saidas.length) return;

    const fim = Date.parse(alvo.getAttribute('data-deadline'));
    if (!Number.isFinite(fim)) return;

    const dd = (n) => String(n).padStart(2, '0');
    const escrever = (txt) => saidas.forEach((e) => { e.textContent = txt; });

    const passo = () => {
      const resta = fim - Date.now();
      if (resta <= 0) {
        // o lote virou: a borda é quem sabe o novo preço, então recarrega
        escrever('atualizando…');
        setTimeout(() => location.reload(), 1200);
        return;
      }
      const s = Math.floor(resta / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const seg = s % 60;
      escrever(d > 0
        ? `${d}d ${dd(h)}h ${dd(m)}m ${dd(seg)}s`
        : `${dd(h)}h ${dd(m)}m ${dd(seg)}s`);
      requestAnimationFrame(() => setTimeout(passo, 1000 - (Date.now() % 1000)));
    };
    passo();
  })();

  /* ─── entrada suave ───────────────────────────────────────── */
  (function revelar() {
    const alvos = $$('.reveal');
    if (!alvos.length) return;
    if (semMovimento || !('IntersectionObserver' in window)) {
      alvos.forEach((e) => e.classList.add('visivel'));
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('visivel');
          obs.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    alvos.forEach((e) => obs.observe(e));
  })();

  /* ─── barra fixa de compra ────────────────────────────────── */
  (function barra() {
    const barra = $('[data-barra]');
    const gatilho = $('[data-barra-gatilho]');
    if (!barra || !gatilho || !('IntersectionObserver' in window)) return;

    new IntersectionObserver(
      ([e]) => {
        if (e.boundingClientRect.top < 0 && !e.isIntersecting) {
          barra.setAttribute('data-visivel', '');
        } else {
          barra.removeAttribute('data-visivel');
        }
      },
      { threshold: 0 }
    ).observe(gatilho);
  })();

  /* ─── evento de checkout no Pixel ─────────────────────────
     Dispara so se o Pixel existir. Sem ID no config, este bloco nao faz
     nada e nenhum script de terceiro e carregado.
     ---------------------------------------------------------- */
  (function checkoutTrack() {
    document.addEventListener('click', (ev) => {
      const a = ev.target.closest('a[data-checkout]');
      if (!a || typeof window.fbq !== 'function') return;
      const tipo = a.getAttribute('data-checkout');
      const preco = document.querySelector(
        tipo === 'vip' ? '[data-slot="preco-vip"]' : '[data-slot="preco-comum"]'
      );
      const valor = preco ? Number(preco.textContent.replace(/[^\d]/g, '')) : undefined;
      const lote = document.documentElement.getAttribute('data-lote') || '';
      window.fbq('track', 'InitiateCheckout', {
        content_name: tipo === 'vip' ? 'VIP Diagnostico dos 5 Corpos' : `Comum ${lote}`,
        content_category: 'Imersao Segredos da Mente Magra',
        value: valor,
        currency: 'BRL',
      });
    }, { passive: true });
  })();

  /* ─── UTM: rede de segurança ──────────────────────────────
     A borda já decora os links de checkout. Isto cobre dois casos que
     a borda não alcança: links inseridos depois do carregamento, e a
     visitante que navega para outra página e volta (sessionStorage).
     ---------------------------------------------------------- */
  (function utm() {
    const HOSTS = ['pay.hub.la', 'invoice.hub.la', 'app.hub.la', 'hub.la'];
    const CHAVES = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const EXATOS = new Set(['sck', 'src', 'ref', 'xcod', 'aff', 'affiliate', 'fbclid',
      'gclid', 'ttclid', 'msclkid', 'twclid', 'li_fat_id', 'epik', 'igshid']);
    // mesma lista de permissao da borda: o destino e uma pagina de pagamento e
    // repassar parametro arbitrario para la deixa qualquer pessoa montar um
    // link que altera o checkout
    const permitido = (k) => k.toLowerCase().startsWith('utm_') || EXATOS.has(k.toLowerCase());
    const GUARDA = 'smm:utm';

    let params = new URLSearchParams(location.search);
    for (const k of [...params.keys()]) if (!permitido(k)) params.delete(k);

    try {
      if (params.toString()) sessionStorage.setItem(GUARDA, params.toString());
      else {
        const salvo = sessionStorage.getItem(GUARDA);
        if (salvo) params = new URLSearchParams(salvo);
      }
    } catch { /* modo privado bloqueia sessionStorage — segue sem persistir */ }

    if (!params.toString()) return;

    const valores = CHAVES.map((k) => params.get(k) || '');
    const sck = valores.some(Boolean) ? valores.join('|') : '';

    for (const a of $$('a[href]')) {
      let u;
      try { u = new URL(a.href, location.href); } catch { continue; }
      if (!HOSTS.includes(u.hostname.replace(/^www\./, ''))) continue;
      params.forEach((v, k) => { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
      if (sck && !u.searchParams.has('sck')) u.searchParams.set('sck', sck);
      a.href = u.toString();
    }
  })();
})();
