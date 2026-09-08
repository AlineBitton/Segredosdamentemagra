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

Digite `smm.afinandocorpoemente.com.br`, e depois repita para
`www.smm.afinandocorpoemente.com.br`. A Cloudflare cria o registro sozinha,
porque a zona já é dela, e o certificado sai em alguns minutos. Um custom
domain de Worker tem certificado do nome exato — é por isso que `www.smm`
funciona, coisa que o certificado Universal da zona, que cobre só um nível,
não daria conta.

Os dois já estão ligados. Este passo fica registrado para o caso de precisar
refazer.

> **Por que isso não está no `wrangler.toml`.** Declarar os domínios lá com
> `custom_domain = true` faria cada `wrangler deploy` recriar e reapontar o DNS
> sozinho — o que é melhor, porque um conflito de nome viraria erro visível em
> vez de site fora do ar em silêncio. O problema é o outro lado: se o nome
> estiver preso em outro Worker ou num projeto de Pages, o deploy **inteiro**
> falha. Enquanto a página estiver vendendo, isso troca um risco pequeno de DNS
> por um risco grande de não conseguir publicar correção nenhuma. Depois do
> evento, vale ligar.

> **O erro 1000 da raiz é outro problema.** `www.afinandocorpoemente.com.br`
> responde *Error 1000 — DNS points to prohibited IP*: o registro daquele nome
> aponta para um IP que a Cloudflare recusa (normalmente um IP da própria
> Cloudflare, herdado de uma hospedagem antiga). É um registro de outro site,
> na mesma zona, e não afeta o `smm` — que é um Worker e nem chega a ter
> origem. Consertar um não conserta nem quebra o outro.

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

## Os eventos da Meta

Há **um** Pixel — `10008229355968163` — nas duas páginas, sem plugin: hash na
CSP, nada de terceiro além do `fbevents.js`. Um pixel por site é o certo; dois
IDs na mesma jornada quebrariam a atribuição, porque o Gerenciador não ligaria
o `Purchase` de um dataset ao `InitiateCheckout` do outro.

O que muda entre as páginas são os eventos:

| página | eventos |
|---|---|
| venda | `PageView`, e `InitiateCheckout` no clique do botão — com valor, lote e se é VIP ou comum |
| agradecimento | `PageView` e `Purchase` |

**A venda é marcada por um evento só.** Havia também um evento personalizado,
`Venda Imersão Código do Emagrecimento`, disparado na mesma página e no mesmo
instante do `Purchase` — dois registros para o mesmo fato, e a venda aparecendo
em dobro conforme a coluna que se olhasse. Ele saiu. Se um dia for preciso
separar produtos, o caminho é `content_name` dentro do próprio `Purchase`,
nunca um segundo evento no mesmo disparo.

> Antes de subir, confira no Gerenciador de Anúncios se alguma campanha ativa
> usa `Venda Imersão Código do Emagrecimento` como evento de otimização ou de
> conversão personalizada. Se usar, troque para `Purchase` **antes** — senão a
> campanha fica otimizando para um evento que parou de existir.

### Os dois caminhos da compra

A compra é relatada **duas vezes**, de propósito:

1. **Pelo navegador**, no `fbq('track','Purchase', …)`.
2. **Pelo servidor**, pela Conversion API, direto da borda da Cloudflare.

O segundo existe porque o primeiro falha calado. Bloqueador de anúncio, Safari
com prevenção de rastreio, aba fechada antes de o `fbevents.js` carregar — a
compra aconteceu, a campanha não recebeu o crédito, e o algoritmo passou a
otimizar no escuro. O relato do servidor não depende de nada no navegador.

**Os dois carregam o mesmo `event_id`.** O Worker sorteia um identificador por
visita, escreve em `data-evento-id` no `<html>` e manda o mesmo pela Conversion
API. A Meta vê os dois relatos, reconhece o identificador e conta **uma**
compra. Sem isso o relatório dobraria e o custo por conversão apareceria pela
metade — o erro mais caro desse tipo de montagem, porque parece um bom
resultado.

O endereço da página pós-compra mora em `PAGINA_POS_COMPRA`, no config. Ele
precisa ser o mesmo em três lugares — o build, que injeta o `Purchase` por nome
de arquivo; a borda, que monta o `event_id`; e a Hubla, que redireciona para cá
depois do pagamento. Quando esse nome mudou e só o build acompanhou, a borda
ficou olhando para uma página que não existia mais e o relato pelo servidor
simplesmente não acontecia, sem erro nenhum aparecer.

Por causa disso a página de agradecimento responde `Cache-Control: no-store`.
Se ela fosse cacheada na borda, várias compradoras receberiam o mesmo
`event_id` e a Meta juntaria todas as compras numa só. A página de venda
continua cacheada normalmente.

### Ligar o token

O token da CAPI **não está no repositório e não deve entrar**: é credencial de
servidor, com permissão de escrita na conta de anúncios.

```
npx wrangler secret put META_CAPI_TOKEN
```

A borda lê em `env.META_CAPI_TOKEN`; o navegador nunca vê. Enquanto o segredo
não existir, o envio pelo servidor simplesmente não acontece e o pixel do
navegador continua funcionando como antes.

Para rodar localmente (`npm run dev`), o mesmo valor vai num arquivo
`.dev.vars` — que está no `.gitignore` e nunca deve ser versionado.

### Conferir se chegou

```
npx wrangler tail
```

Abra a página de agradecimento. Se a Meta recusar, a linha `CAPI <status>`
aparece aí com o motivo. Nada disso quebra a página: a compradora já pagou, e
erro de relatório não pode virar erro de tela.

Para ver o evento no Gerenciador antes de valer para as campanhas, use
*Gerenciador de Eventos → Testar eventos*, pegue o código e ligue o segredo
`META_CAPI_TEST_CODE`. **Apague-o depois** — com ele preenchido, as compras
não entram nos relatórios de verdade.

### O webhook da Hubla — o relato bom da compra

O `Purchase` da página tem três limites, todos silenciosos: marca quem só
**abriu** o endereço (e de novo a cada F5), vai **sem valor**, e vai **sem
atribuição** — a Hubla redireciona para um endereço fixo, então as UTMs que
foram para o checkout não voltam.

O webhook resolve os três. A Hubla avisa a borda quando o dinheiro entra, e
nesse aviso vem o valor, o e-mail de quem comprou e o `sck` que a página mandou
no link. Vira um `Purchase` com valor, com atribuição, e só para quem pagou.

O endereço é `/hubla/<segredo>`, e o segredo mora no Worker
(`HUBLA_WEBHOOK_SECRET`). Sem assinatura para conferir, é o endereço que
autentica: quem não o conhece recebe 404. Importa porque uma rota aberta
deixaria qualquer um inventar vendas e envenenar a otimização das campanhas.

Fora o segredo errado, tudo responde 200 — inclusive o que não deu para
entender. A Hubla desliga um webhook que responde erro várias vezes, e um
webhook desligado para de contar tudo.

**Quem marca a compra é um só, nunca os dois.** Assim que
`HUBLA_WEBHOOK_SECRET` existe, o webhook assume e o `Purchase` da página some
sozinho — não há segunda variável para lembrar de ligar.

Isso não é preferência. Os dois ligados marcariam a MESMA venda duas vezes,
com identificadores diferentes, e o relatório dobraria: exatamente o defeito
que este trabalho começou consertando. Deixar isso depender de alguém lembrar
de um segundo passo era deixá-lo voltar de graça.

`PURCHASE_NA_PAGINA=sim` força o jeito antigo de volta, para o caso de o
webhook precisar ser desligado às pressas sem ficar sem marcação nenhuma.

A ordem de ligar:

1. `HUBLA_WEBHOOK_SECRET` no Worker → a rota passa a existir, e a página para
   de marcar
2. o webhook configurado na Hubla, apontando para `/hubla/<segredo>`
3. uma compra de teste, com os logs abertos

### Conferir o token da Meta sem esperar uma venda

```
/hubla/<segredo>?testar=meta
```

Pergunta à Meta se o token vale e se ele enxerga este pixel. **Nenhum evento é
criado.** Existe porque, sem isso, um token errado só apareceria na primeira
compra de verdade — como uma venda perdida, no pior momento possível.

**O formato do aviso.** Cada plataforma nomeia os campos de um jeito, e a Hubla
já mudou entre versões da API. Por isso o código procura cada campo pelo nome,
em qualquer profundidade, em vez de seguir um caminho fixo que quebraria em
silêncio. O aviso inteiro vai para o log na chegada — é com um aviso de verdade
que se confere o que a Hubla realmente manda.

Duas coisas para olhar no log da primeira venda:

- `HUBLA tipo desconhecido` — o tipo do aviso não está na lista de "isto é
  venda", em `worker/hubla.js`. Nada foi enviado, de propósito: inventar venda
  é pior que perder uma. Acrescente o tipo à lista.
- `HUBLA valor bruto X → enviado Y` — se o valor chegar cem vezes maior ou
  menor no Gerenciador, a Hubla manda em reais, não em centavos. Ligue a
  variável `HUBLA_VALOR_EM_REAIS` no Worker.
- `HUBLA venda SEM campanha no aviso` — a venda foi contada, mas a Hubla não
  devolveu o `sck` que a página mandou no checkout. Não quebra nada; significa
  que aquela venda chega na Meta sem dizer de qual criativo veio.

### A atribuição sobrevive à ida e volta da Hubla

A compradora chega com as UTMs na URL, vai para a Hubla e volta para a página
pós-compra por um **endereço fixo**. As UTMs não voltam. Sem tratar isso, o
`Purchase` sabe que houve venda e não sabe de onde veio — que é justamente o
que responde "qual criativo está vendendo".

Dois caminhos independentes resolvem, e os dois estão ligados:

1. **Na ida**, a borda copia as UTMs para o link do checkout e monta o `sck`.
   Se a Hubla devolver esse `sck` no aviso de pagamento, o webhook o usa.
2. **Um cookie de primeira parte** (`smm_atrib`, 30 dias, `SameSite=Lax`)
   guarda a campanha na chegada. Ele sobrevive à ida e à volta, porque as duas
   são navegação de topo — e continua valendo se a compra acontecer no dia
   seguinte. A borda lê esse cookie na página pós-compra e manda a campanha
   junto do `Purchase`.

O segundo caminho não depende de a Hubla devolver nada. É o que garante a
atribuição mesmo que a plataforma ignore os parâmetros.

A resposta que grava o cookie responde `private, no-store`: resposta com
cookie é de uma pessoa só, e num cache compartilhado a próxima visitante
herdaria a campanha da anterior. Custa uma requisição sem cache por visita — a
segunda página já volta a ser cacheada, porque não traz parâmetro de campanha.

### O contador e a página em que ele está

A página de venda conta até a virada do lote. A pós-compra conta até a aula de
abertura — lá o lote já não quer dizer nada, a compra foi feita.

O HTML da pós-compra já vinha do build com a data certa, e a borda a
sobrescrevia com a do lote em toda página: o rótulo dizia "até a aula de
abertura" embaixo de uma contagem que ia até o fim do lote. Mesma classe de
erro do endereço `/obrigado` — a borda sem saber em que página estava. Agora o
alvo vem de `EVENTO.inicioISO` na pós-compra e de `lote.fim` no resto.

### Se o token vazar

Um token de CAPI visto por qualquer pessoa — print, chat, e-mail — está
comprometido e precisa ser trocado, mesmo que nada de errado tenha acontecido.
Em *Gerenciador de Eventos → Configurações → Conversions API*, gere um token
novo, o antigo perde a validade, e repita o `wrangler secret put`.

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

- Abra `smm.afinandocorpoemente.com.br` e `smm.afinandocorpoemente.com.br/nos-vemos-no-evento`
- No Gerenciador de Eventos do Meta, confirme o `PageView` chegando
- Faça uma compra de teste e confirme o `Purchase` na página de agradecimento
- Na Hub.la, configure o redirecionamento pós-compra dos cinco checkouts para
  `https://smm.afinandocorpoemente.com.br/nos-vemos-no-evento`
- Nos anúncios, use `?p=data` para servir a variante B do hero — a que fala com
  quem já tem data para parar a caneta. Sem o parâmetro, entra a versão A.
