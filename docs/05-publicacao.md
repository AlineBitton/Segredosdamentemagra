# Publicação

A página fica em **afinandocorpoemente.com.br/smm**.

O site inteiro é gerado dentro de `dist/smm/`, e todo caminho absoluto sai com
o prefixo — `/smm/img/...`, `/smm/fonts/...`, `/smm/obrigado`. Isso importa: em
nenhum dos dois modelos de publicação abaixo existe caminho para traduzir no
servidor, o que é a fonte mais comum de link quebrado quando um site mora num
subcaminho. `dist/index.html` é só um redirecionamento da raiz para `/smm/`.

---

## O que eu não consigo fazer, e por quê

Ligar o domínio exige entrar na sua conta da Cloudflare. Eu não tenho acesso a
ela e não devo ter — é a conta que controla o DNS de todos os seus domínios.

**A boa notícia é que a GoDaddy não precisa ser tocada.** O seu DNS já está na
Cloudflare, e é lá que tudo acontece. A GoDaddy só guarda o registro do
domínio; os nameservers já apontam para a Cloudflare.

Você não precisa me passar arquivo nenhum: o repositório já é a fonte. Você
conecta o repositório ao Cloudflare Pages uma vez, e a partir daí todo push
publica sozinho.

---

## Caminho 1 — o domínio ainda não serve outro site

Este é o mais simples. Cinco minutos, sem Worker, sem código extra.

1. **Cloudflare → Workers & Pages → Create → Pages → Connect to Git**
2. Escolha o repositório `AlineBitton/Segredosdamentemagra`
3. Configurações de build:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Branch:** `claude/segredos-mente-magra-landing-f2dwfw` (ou `main`, depois do merge)
4. **Deploy**. Sai um endereço `xxx.pages.dev` — abra e confira em `/smm/`.
5. **Custom domains → Set up a custom domain →** `afinandocorpoemente.com.br`

A Cloudflare cria o registro de DNS sozinha, porque a zona já é dela.

Pronto: **afinandocorpoemente.com.br/smm** no ar, e quem cair na raiz é
redirecionado para lá.

---

## Caminho 2 — o domínio já serve outro site

Se a raiz já tem WordPress ou qualquer outra coisa que precisa continuar
funcionando, `/smm` entra na frente por um Worker.

1. Faça o deploy do Pages como no Caminho 1, mas **pare no passo 4** — não
   ligue o domínio ao Pages.
2. **Workers & Pages → Create → Worker.** Cole `worker/smm.js` do repositório.
3. **Settings → Variables and Secrets → Add:**
   - `ORIGEM` = `https://xxx.pages.dev` (o endereço que o Pages te deu)
4. **Settings → Triggers → Routes → Add route:**
   - Route: `afinandocorpoemente.com.br/smm*`
   - Zone: `afinandocorpoemente.com.br`
5. O registro de DNS da raiz precisa estar **proxied** (nuvem laranja). Sem
   isso o pedido não passa pela Cloudflare e a rota nunca dispara.

O Worker repassa o caminho sem traduzir. É de propósito: o Pages tem `/smm/`
exatamente onde o navegador pede.

---

## Alternativa que eu recomendaria

**smm.afinandocorpoemente.com.br**, em vez de `/smm`.

É um registro de CNAME e nada mais: sem Worker, sem prefixo de caminho, sem
risco de conflito com o site que já existe. Se um dia a raiz mudar de
hospedagem, a página não é afetada.

O `/smm` funciona e está implementado. Mas se a decisão ainda estiver aberta, o
subdomínio é menos peça móvel. Para mudar, é uma linha:

```
SMM_BASE='' npm run build
```

---

## A Conversion API

O token da CAPI **não está no repositório**, e não deve entrar. Quando for
ligar:

```
wrangler secret put META_CAPI_TOKEN
```

A função de borda lê em `env.META_CAPI_TOKEN`. O navegador nunca vê.

O Pixel (`10008229355968163`) já está nas duas páginas, sem plugin: hash na
CSP, `PageView` na venda e `Purchase` mais o evento nomeado das campanhas na de
agradecimento.

---

## Antes de apontar o domínio

```
npm run verificar
```

Roda os testes de lote, a paleta, os cinco estados do ciclo, o orçamento de
peso, a CSP, a acessibilidade, a auditoria de leitura no navegador, o teste
responsivo em sete larguras e a checagem de pré-voo. Se algum reprovar, o
comando falha e a publicação não deve acontecer.

```
npm run medir
```

Roda o Lighthouse em mobile e desktop e grava os relatórios em
`docs/medicao/`.

---

## Depois de publicar

- Confira `afinandocorpoemente.com.br/smm` e `/smm/obrigado`
- Confira a raiz: tem que redirecionar para `/smm/`
- No Gerenciador de Eventos do Meta, confirme o `PageView` chegando
- Faça uma compra de teste e confirme o `Purchase` na página de agradecimento
- Configure a Hub.la para redirecionar a compra para
  `afinandocorpoemente.com.br/smm/obrigado`
