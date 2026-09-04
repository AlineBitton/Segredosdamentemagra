# Imersão Segredos da Mente Magra — 25, 26 e 27 de setembro
## Documento 00 — Estratégia, arquitetura e decisões

> Este documento é a fonte da verdade. Toda decisão de copy, código, preço,
> deploy e medição referencia aqui. Atualizar antes de mudar código.

---

## 1. Tese estratégica da página

A página tem **dois produtos** e **um alvo**.

| Produto | Preço | Papel real |
|---|---|---|
| Ingresso Comum | R$27 → R$47 → R$67 → R$97 (por lote) | Porta de entrada. Baixa fricção. |
| Ingresso VIP | R$197 fixo | **É aqui que a persona compra.** |

O mapa de persona entregue (Renata, 38–52, renda R$15–40k, paga R$1.000–1.800/mês
de medicação sem pedir autorização a ninguém) **não é uma compradora de R$27**.
Ela é uma compradora de R$197 que não sente o preço — o que ela sente é
*se alguém finalmente vai olhar o conjunto*.

Por isso a página inteira é construída para que o VIP seja a **escolha óbvia**,
não a escolha cara:

- O Comum resolve "assistir".
- O VIP resolve a **pergunta que ela leva para todo lugar e volta com ela inteira**:
  *"e depois?"* — porque o VIP inclui 50 minutos ao vivo, um a um, com a Aline.

O diferencial competitivo do VIP, na moeda dela:
> "Endócrino leu exame. Nutri leu comportamento. Terapeuta leu emoção.
> Ninguém leu o sistema inteiro."

O VIP é a primeira vez que alguém lê o sistema inteiro. **Esse é o argumento.**
Não é "acesso vitalício" nem "bônus exclusivo". É leitura do conjunto.

---

## 2. Nome do produto VIP (pedido: "com base na narrativa, sugira esse nome")

Entregáveis do VIP: gravação por até 1 ano + consulta de diagnóstico de 50 min
com a Aline por Google Meet, após o evento.

### Opções

| # | Nome do tier | Nome da consulta | Racional |
|---|---|---|---|
| 1 | **VIP · Leitura dos 5 Corpos** | Leitura dos 5 Corpos | "Alguém leu o sistema inteiro." Fala direto com a dor central: cada profissional leu uma fatia. |
| 2 | **VIP · Diagnóstico dos 5 Corpos** | Diagnóstico dos 5 Corpos | Mais concreto e mais vendável. "Diagnóstico" é palavra que ela respeita — ela já leu bula. |
| 3 | **VIP · Mapa dos 5 Corpos** | Mapa dos 5 Corpos | "Mapa" devolve previsibilidade (a moeda certa). Menos clínico que "diagnóstico". |
| 4 | **VIP · Sala Íntima** | Encontro Íntimo | Emocional. Risco: genérico, não diferencia. |
| 5 | **VIP · Acesso Integral** | — | Fraco. Fala de acesso, não de resultado. Descartar. |

### Recomendação

**Tier: `VIP — Diagnóstico dos 5 Corpos`**
**Consulta: `Diagnóstico dos 5 Corpos` — 50 minutos, ao vivo, só seu, com a Aline.**
**Gravação: `Passe de 1 ano` — reveja a imersão inteira por 12 meses.**

Motivo: "diagnóstico" é a única palavra do conjunto que promete **capacidade**
(saber o que está acontecendo) e não **desfecho** (ter emagrecido) — regra de ouro
do mapa de persona. E é a palavra que separa o VIP do Comum sem depender de escassez.

---

## 3. Tensões entre o mapa da persona e a copy mandatória

A copy das dobras foi aprovada em consultoria e será mantida na estrutura.
Mas há **cinco pontos** onde ela viola regras explícitas do próprio mapa de persona.
Correções propostas abaixo — nenhuma muda a mensagem, todas mudam a recepção.

| # | Onde | Problema | Correção proposta |
|---|---|---|---|
| 1 | Dobra 4 | "a um nível de **reprogramação mental**" | Mapa: "reprogramar o inconsciente" está na lista de *jargão que ela lê como enrolação*. → **"no ponto onde o impulso nasce, antes de virar decisão"** |
| 2 | Dobra 2 | "basta **força de vontade**" | Mapa: "moralização do esforço" afasta. A frase funciona **se for a mentira que contaram pra ela**, não a falha dela. → reescrever como acusação ao mercado, não a ela |
| 3 | Dobra "2 caminhos" | "Investir menos que 1 iFood" | Para quem paga R$1.500/mês de medicação, barato demais **desvaloriza**. Manter na coluna **Comum**; na coluna **VIP** trocar por argumento de valor (o que custa 50 min de consulta avulsa) |
| 4 | Global | Qualquer promessa de desfecho ("nunca mais", "livre para sempre") | Mapa: reinstala a perfeição que quebrou ela. → **auditoria: zero promessa de desfecho na página inteira.** Só capacidade. |
| 5 | Global | Silêncio sobre medicação | **Maior risco e maior oportunidade.** Ela usa caneta e esconde. Se a página soar anti-medicação, ela sai e não volta. Se soar aliada, converte na hora. → ver item 4 abaixo |

### 3.1 Adição recomendada (fora da estrutura entregue)

Uma linha, em barra de confiança logo abaixo do hero:

> **Aqui ninguém vai te pedir para parar nada.**
> Se você usa medicação, esta imersão trabalha o que a medicação não faz —
> e não disputa com o seu médico.

Justificativa: é a única frase da página que a persona nunca viu em lugar nenhum.
O mercado inteiro ataca quem usa. Reconhecimento antes de argumento = abre conversa.
**Custo: 2 linhas. Impacto: alto.** Precisa da sua aprovação — é adição, não ajuste.

---

## 4. Arquitetura de dobras (ordem final)

| # | Dobra | Origem | CTA verde? |
|---|---|---|---|
| 01 | **Hero** — promessa + datas + lote ativo + CTA | mantida (imagem refeita) | Sim |
| 02 | **Barra de neutralidade** ("ninguém vai te pedir pra parar nada") | ★ adição proposta | — |
| 03 | **Estado atual da persona** — "Você tenta começar muitas coisas, mas…" | nova dobra 2 | Sim |
| 04 | **Quebra de objeções** — "Você não precisa de mais uma dieta…" | nova dobra 3 | Sim |
| 05 | **O que você faz em 3 dias** | nova dobra 4 | Sim |
| 06 | **Dobra emocional** — "Emagrecer acontece enquanto a vida acontece" | nova dobra 5 | Sim |
| 07 | **"FAZER A BALANÇA DESCER DEPENDE DISSO"** — os 5 corpos | antiga dobra 2 | Sim |
| 08 | **Para quem é** — "mulheres que já passaram dos 40 e…" | dobra 7 | — |
| 09 | **Para quem NÃO é** | dobra 8 | — |
| 10 | **Provas** — "Conheça algumas mulheres que já emagreceram com Aline Bitton" | dobra de provas | Sim |
| 11 | **Quem é sua guia** — Aline | mantida | — |
| 12 | **2 caminhos** — Tentar sozinha × Com a Imersão | ★ nova | Sim |
| 13 | **A OFERTA** — Comum × VIP, lote ativo, contador | núcleo | Sim (x2) |
| 14 | **"Por que custa tão barato?"** | ★ nova | Sim |
| 15 | **Garantia incondicional** | ★ nova | Sim |
| 16 | **FAQ** — 5 perguntas | ★ nova | — |
| 17 | **Suporte WhatsApp + rodapé** | ★ nova | WhatsApp (verde nativo) |
| — | **Barra fixa mobile** — lote + preço + CTA, sempre visível | ★ adição | Sim |

Total: 17 dobras + barra fixa. **10 CTAs verdes**, espaçados a cada ~1,5 dobra.

---

## 5. Motor de lotes (price engine)

### Tabela oficial

| Lote | Início (America/Sao_Paulo) | Fim | Comum | VIP |
|---|---|---|---|---|
| Especial | — | **09/09 23:59:59** | **R$27** | R$197 |
| 2 | 10/09 00:00:00 | 15/09 23:59:59 | **R$47** | R$197 |
| 3 | 16/09 00:00:00 | 22/09 23:59:59 | **R$67** | R$197 |
| 4 | 23/09 00:00:00 | 25/09 (início do evento) | **R$97** | R$197 |

Regra: **em cada data aparecem exatamente dois preços** — Comum (do lote vigente)
e VIP (R$197, fixo). Nunca mostrar os quatro lotes ao mesmo tempo como tabela.
Mostrar: preço vigente + contador para o próximo aumento (aversão à perda honesta).

### Implementação — decisão

O cálculo do lote acontece **na borda (Cloudflare Pages Function + HTMLRewriter)**,
não no navegador.

Motivo: se o cálculo for client-side com `new Date()`, um relógio errado no celular
da compradora mostra R$27 e o checkout da hub.la cobra R$47 → fricção, chargeback,
suporte. Na borda, o relógio é o da Cloudflare — autoritativo.

Custo de performance: ~0ms (HTMLRewriter é streaming, roda no mesmo POP).
Cache: `Cache-Control: public, s-maxage=<segundos até a próxima virada, teto 300s>`.

O JavaScript do cliente **apenas conta o tempo restante** — nunca altera preço.
Na virada, faz `location.reload()` uma vez.

### ⚠️ Bloqueio a confirmar com você

Os links da hub.la:
- Comum: `https://hub.la/g/EsOXcCvHKYCeq0J2t5Zk`
- VIP: `https://hub.la/g/8uuaLE8FfUWJC4d2rn4t` · checkout direto `https://pay.hub.la/tdO52QluixGZPMu0Oqt7`

**Pergunta:** o link do Comum muda de preço sozinho na hub.la conforme o lote,
ou existe **um link diferente por lote**? Se for um por lote, preciso dos 4.
Enquanto não confirmar, assumo **link único com preço controlado pela hub.la**.

**Pergunta 2:** existe `pay.hub.la/...` (checkout direto) para o **Comum**?
Checkout direto converte mais que página de produto — para o VIP já temos.

---

## 6. UTM e troca de promessa no Meta

Três camadas, nesta ordem:

**a) Propagação de UTM para a hub.la** — o script que você enviou já faz isso
(decora `a[href]` para os hosts `pay.hub.la`, `invoice.hub.la`, `app.hub.la`, `hub.la`,
e monta o `sck` concatenando os 5 UTMs). Será integrado **inline e minificado**,
sem requisição extra. Adição: persistir em `sessionStorage` para os UTMs
sobreviverem a qualquer navegação interna.

**b) Troca de promessa** — o parâmetro `?p=` (ou `utm_content`) seleciona uma variante
de headline/subheadline **na borda**, junto com o lote. Zero flash, zero CLS, zero JS.

| `?p=` | Headline servida | Ângulo do anúncio |
|---|---|---|
| *(vazio)* | Promessa-mãe | Genérico / retargeting |
| `sanfona` | O sobe e desce da balança | Ciclo ganho/reganho |
| `40mais` | Depois dos 40 o corpo mudou as regras | Faixa etária |
| `balanca` | "Eu subo pra confirmar que ainda tá lá" | Vigilância / balança |
| `roupa` | O que você faz com a roupa que não serve mais | Guarda-roupa / identidade |
| `edepois` | "E quando eu parar?" | ★ o ângulo que vende o VIP |

Cada variante é uma linha num mapa JSON. Criar variante nova = 1 linha, sem deploy de código.

**c) Pixel / eventos** — `PageView`, `ViewContent`, `InitiateCheckout` no clique de CTA
com `content_name` = lote + tipo de ingresso, e `value` = preço vigente.
**Preciso do Pixel ID.** Carregamento diferido para não afetar LCP.

---

## 7. Performance — meta A+

| Métrica | Meta |
|---|---|
| Lighthouse Mobile (Perf / A11y / BP / SEO) | **100 / 100 / 100 / 100** |
| LCP | **< 1,5s** (4G simulado) |
| CLS | **0** |
| INP | **< 100ms** |
| Peso total da primeira dobra | **< 120 KB** |
| Requisições até LCP | **≤ 3** |

Decisões:
- **Zero framework.** HTML + CSS + < 5 KB de JS. Sem jQuery, sem React, sem Tailwind CDN.
- **Fontes self-hosted** em WOFF2 com subset latino, `font-display: swap`, `preload`
  só do peso do H1. Sem Google Fonts (elimina 1 DNS + 1 TLS + 1 hop).
- **Imagens** AVIF com fallback WebP via `<picture>`, `width`/`height` explícitos,
  `fetchpriority="high"` só no hero, `loading="lazy"` no resto.
- **CSS crítico inline** no `<head>`; o resto carregado de forma não bloqueante.
- **CLS zero**: toda imagem, contador e acordeão com espaço reservado.
- **Sem animação por scroll pesada.** Só `transform`/`opacity`, e respeitando
  `prefers-reduced-motion`.
- Cloudflare: Brotli, HTTP/3, Early Hints ligados.

Medição (item 3 da sua revisão): Lighthouse rodado localmente via o Chromium
já instalado neste ambiente, mobile + desktop, relatório salvo em `docs/`.

---

## 8. Cor dos CTAs (item 1 da sua revisão)

Todos os CTAs passam a ser **verdes**. Token proposto:

```
--cta:        #0F863B   /* verde principal · 4,67:1 com branco — passa AA */
--cta-hover:  #0C6E30   /* 6,39:1 */
--cta-ring:   #22C55E   /* anel de foco — uso não-textual */
--cta-shadow: 0 6px 20px rgba(15,134,59,.32)
--cta-text:   #FFFFFF
```

> ⚠️ **Correção.** A primeira versão deste documento trazia `#17A44B` com a
> afirmação "contraste 4.6:1 — passa AA". O valor real, calculado, é **3,26:1**:
> passa apenas em texto grande e reprovaria a auditoria do Lighthouse.
> O verde oficial é `#0F863B`. Ver doc 03, §0.

Regra de neurodesign que faz isso funcionar — **efeito Von Restorff (isolamento)**:
o verde só captura atenção pré-atentiva se for a **única** coisa verde na página.
Portanto: nenhum ícone, borda, badge, selo ou destaque verde. Verde = ação, e só.
Destaques secundários usam âmbar/dourado.

---

## 9. Gatilhos de neuroestética e neuromarketing (por que cada escolha existe)

| Gatilho | Aplicação na página |
|---|---|
| **Fluência de processamento** | Alto contraste, tipografia de x-height grande, linha de 45–75 caracteres. Texto fácil de ler é julgado como mais verdadeiro. |
| **Von Restorff (isolamento)** | Verde exclusivo do CTA. |
| **Posição serial** | Promessa mais forte no topo, garantia no fim — os dois pontos mais memorizados. |
| **Ancoragem** | VIP ao lado do Comum, com o valor do que ele contém explicitado antes do preço. |
| **Aversão à perda honesta** | Contador real do lote. Sem escassez falsa — a persona detecta e sai. |
| **Gaze cueing** | Fotos de depoimento com olhar direcionado ao CTA. |
| **Prospect–refuge** | Hero com respiro visual (não abarrotado) reduz percepção de ameaça. |
| **Carga cognitiva** | Máx. 5 linhas por coluna no bloco de oferta. |
| **Efeito de mera exposição** | CTA repetido a cada ~1,5 dobra, sempre idêntico. |
| **Reconhecimento antes de argumento** | Dobra 03 usa as frases literais dela ("eu subo pra confirmar", "eu vou logo no G"). |

---

## 10. Hospedagem e DNS

**Stack:** Cloudflare Pages + Pages Functions. Domínio `afinandocorpoemente.com.br`
hoje na GoDaddy → migrar **nameservers** para a Cloudflare.

### Passo a passo

1. Cloudflare → *Add a site* → `afinandocorpoemente.com.br` → plano **Free**.
2. ⚠️ **Antes de trocar o NS:** exportar TODOS os registros atuais da GoDaddy —
   especialmente **MX** (e-mail), **TXT** (SPF, DKIM, DMARC) e subdomínios.
   A Cloudflare importa automaticamente, mas **conferir registro a registro**.
   Se um MX se perder, o e-mail do domínio para de funcionar.
3. Cloudflare fornece 2 nameservers (ex.: `ana.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
4. GoDaddy → *Meus Produtos* → domínio → *DNS* → *Nameservers* → *Alterar* →
   *Usar meus próprios nameservers* → colar os dois → salvar.
   Propagação: normalmente < 1h, até 24h.
5. Cloudflare Pages → projeto → *Custom domains* → adicionar apex + `www`.
6. SSL/TLS: **Full (strict)** · *Always Use HTTPS* ON · *Automatic HTTPS Rewrites* ON.
7. Canônico: apex `afinandocorpoemente.com.br`; `www` → 301 para o apex.

### ⚠️ Pergunta bloqueante

**Já existe um site nesse domínio hoje?** Se sim, publicar a LP na **raiz** derruba
o que está lá. Opções:
- (a) LP na raiz — só se o domínio estiver livre;
- (b) `afinandocorpoemente.com.br/segredosdamentemagra` — **recomendado**;
- (c) subdomínio `imersao.afinandocorpoemente.com.br`.

Assumindo **(b)** até você confirmar.

---

## 11. Pendências — o que eu preciso de você

### Bloqueia entrega
1. **Depoimentos da `/cde-v2/`** — o domínio está bloqueado pela política de rede
   deste ambiente. Cole o texto (nome, kg, tempo, depoimento) ou mande as imagens.
2. **Anexo "as ofertas"** (o riscado é só do VIP) — preciso da lista exata
   de entregáveis Comum × VIP.
3. **Horários dos 3 dias** (25, 26 e 27/09) e **onde acontece** (Zoom? YouTube? plataforma?).
4. **Link de checkout do Comum por lote** — ver §5.

### Bloqueia otimização, não a entrega
5. Meta **Pixel ID**.
6. Número do **WhatsApp** de suporte.
7. Fotos: **Aline** (hero + dobra "sua guia") e fotos das mulheres dos depoimentos.
8. Logo, cores da marca, fontes (se houver manual).
9. O domínio já tem site? (§10)

### Referências citadas que não chegaram
10. Layout de referência · modelo da Nathy · vídeo de referência dos "2 caminhos".
    Sigo com direção própria e você corrige depois.
