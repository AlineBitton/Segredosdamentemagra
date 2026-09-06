/**
 * Worker de rota — só é necessário se afinandocorpoemente.com.br já serve
 * outro site (WordPress, por exemplo) e /smm precisa conviver com ele.
 *
 * Se o domínio NÃO tiver outro site, este arquivo não é usado: basta ligar
 * o domínio direto no projeto do Pages, e /smm/ já funciona sozinho, porque
 * o site inteiro é gerado dentro de dist/smm/.
 *
 * Publicação:
 *   1. Workers & Pages → Create → Worker → cole este arquivo
 *   2. Settings → Variables → ORIGEM = https://<projeto>.pages.dev
 *   3. Settings → Triggers → Add route:
 *        afinandocorpoemente.com.br/smm*      (zone: afinandocorpoemente.com.br)
 *
 * O caminho é repassado sem tradução — o Pages tem /smm/ exatamente onde o
 * navegador pede. Traduzir caminho aqui quebraria os links internos.
 */
export default {
  async fetch(requisicao, ambiente) {
    const origem = ambiente.ORIGEM;
    if (!origem) return new Response('ORIGEM não configurada', { status: 500 });

    const url = new URL(requisicao.url);
    const alvo = new URL(url.pathname + url.search, origem);

    // Repassa o pedido inteiro, incluindo os parâmetros de campanha: é deles
    // que a borda do Pages monta o sck e escolhe a variante do hero.
    const resposta = await fetch(alvo, {
      method: requisicao.method,
      headers: requisicao.headers,
      body: requisicao.method === 'GET' || requisicao.method === 'HEAD'
        ? undefined : requisicao.body,
      redirect: 'manual',
    });

    // Cabeçalhos passam intactos — a CSP e o cache vêm do _headers do Pages.
    return new Response(resposta.body, {
      status: resposta.status,
      statusText: resposta.statusText,
      headers: resposta.headers,
    });
  },
};
