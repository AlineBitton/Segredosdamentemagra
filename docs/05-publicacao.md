# Publicação

A página fica em **smm.afinandocorpoemente.com.br**.

Um subdomínio próprio, e não um subcaminho do site principal. A diferença
importa: assim a página não depende de nada que já esteja rodando na raiz, não
precisa de Worker de rota, e se um dia o site principal mudar de hospedagem
esta página não é afetada. É um registro de DNS e nada mais.

---

## O que eu não consigo fazer, e por quê

Ligar o domínio exige entrar na sua conta da Cloudflare. Eu não tenho acesso a
ela e não devo ter — é a conta que controla o DNS de todos os seus domínios.

**A GoDaddy não precisa ser tocada.** O seu DNS já está na Cloudflare, e é lá
que tudo acontece. A GoDaddy só guarda o registro do domínio; os nameservers já
apontam para a Cloudflare.

**Você não precisa me passar arquivo nenhum.** O repositório é a fonte. Você
conecta o repositório ao Cloudflare Pages uma vez, e a partir daí todo push
publica sozinho.

Se preferir subir sem Git, existe o caminho do zip — mais abaixo, em
*Upload direto*. Ele publica igual, mas cada mudança futura vira um zip novo.

---

## Passo a passo

**1. Cloudflare → Workers & Pages → Create → Worker → Connect to Git**

Autorize o GitHub e escolha `AlineBitton/Segredosdamentemagra`.

**2. Configurações de build**

| campo | valor |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Branch | `claude/segredos-mente-magra-landing-f2dwfw` |

> O `wrangler.toml` do repositório é que diz o resto: `main` aponta para
> `worker/index.js` e `[assets]` sobe o `dist/` inteiro junto. O `name` tem de
> bater com o nome do Worker no painel — se não bater, o deploy cria um Worker
> novo em vez de atualizar o que está no ar.

**3. Save and Deploy**

Sai um endereço `xxx.pages.dev`. Abra e confira antes de seguir — a página
inteira já funciona por ele.

**4. Custom domains → Set up a custom domain**

Digite `smm.afinandocorpoemente.com.br`.

A Cloudflare cria o registro de CNAME sozinha, porque a zona já é dela. O
certificado sai em alguns minutos.

Pronto.

---

## Upload direto — o caminho sem Git

Serve para subir agora e decidir o Git depois. Publica exatamente a mesma
página; o que muda é que a Cloudflare não reconstrói nada sozinha: cada
alteração exige gerar e arrastar um zip novo.

```
npm run pacote
```

Sai `pacote/segredos-mente-magra-cloudflare.zip` (1,4 MB, 65 arquivos).

**Cloudflare → Workers & Pages → Create → Pages → Upload assets** — dê um nome
ao projeto, arraste o zip, *Deploy site*. Depois siga o passo 4 do passo a
passo acima para ligar o domínio: o restante é idêntico.

### O que o `npm run pacote` faz a mais que o `npm run build`

No upload direto a Cloudflare não roda `wrangler deploy` — subiria só o HTML
estático, sem o Worker.

Isso não seria um detalhe. É o Worker que decide o lote pelo relógio da
Cloudflare. Sem ele, o site fica congelado no lote vigente na hora do build:
no dia 10 a página ainda diria R$ 27 e a hub.la cobraria R$ 47. Fricção,
suporte e estorno.

Então o `npm run pacote` empacota `worker/index.js` como `_worker.js` na raiz
do site — o *modo avançado* do Pages. É o mesmo código do deploy conectado ao
Git, buscando os estáticos pela mesma ligação ASSETS, que continua aplicando o
`_headers`: CSP, cache das fontes, cache das imagens.

---

## Se um dia a página precisar morar num subcaminho

O mecanismo está no build e é uma variável:

```
SMM_BASE=/smm npm run build
```

Isso gera o site inteiro dentro de `dist/smm/`, com todo caminho absoluto
prefixado — sem nenhuma tradução de caminho no servidor, que é de onde vem link
quebrado quando um site mora fora da raiz. `SITE`, em `scripts/build.mjs`,
precisa acompanhar.

---

## A Conversion API

O token da CAPI **não está no repositório**, e não deve entrar. Quando for
ligar:

```
wrangler secret put META_CAPI_TOKEN
```

A função de borda lê em `env.META_CAPI_TOKEN`. O navegador nunca vê.

O Pixel (`10008229355968163`) já está nas duas páginas, sem plugin: hash na
CSP, `PageView` na venda, e `Purchase` mais o evento nomeado das campanhas na de
agradecimento.

---

## Antes de apontar o domínio

```
npm run verificar
```

Roda, em ordem: os testes do motor de lotes, a conformidade da paleta, os cinco
estados do ciclo de venda, o orçamento de peso, a CSP com a página de pé no
navegador, a acessibilidade, a auditoria de leitura — que mede cada texto
contra o fundo realmente pintado atrás dele —, o teste responsivo em sete
larguras e a checagem de pré-voo. Se qualquer um reprovar, o comando falha.

```
npm run medir
```

Lighthouse em mobile e desktop, com os relatórios em `docs/medicao/`.

---

## Depois de publicar

- Abra `smm.afinandocorpoemente.com.br` e `smm.afinandocorpoemente.com.br/obrigado`
- No Gerenciador de Eventos do Meta, confirme o `PageView` chegando
- Faça uma compra de teste e confirme o `Purchase` na página de agradecimento
- Na Hub.la, configure o redirecionamento pós-compra dos cinco checkouts para
  `https://smm.afinandocorpoemente.com.br/obrigado`
- Nos anúncios, use `?p=data` para servir a variante B do hero — a que fala com
  quem já tem data para parar a caneta. Sem o parâmetro, entra a versão A.
