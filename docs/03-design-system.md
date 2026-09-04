# Documento 03 — Sistema de design

> Todo valor deste documento foi **verificado por cálculo**, não estimado.
> As razões de contraste estão medidas pela fórmula WCAG 2.1 e reproduzidas
> em `scripts/contraste.mjs`.

---

## 0. ⚠️ Correção do documento 00

No bloco 1 eu propus `--cta: #17A44B` e afirmei **4,6:1 — passa AA**.
**Está errado.** O valor real é **3,26:1** — passa apenas em texto grande,
e reprovaria a auditoria de acessibilidade do Lighthouse em qualquer rótulo
de botão abaixo de 18,66px em negrito.

O verde oficial passa a ser **`#0F863B` — 4,67:1 com branco**, que passa AA
para texto normal. Doc 00 corrigido.

---

## 1. Paleta

### Ação — verde, e só verde

```css
--cta:        #0F863B;  /* preenchimento do botão   · 4,67:1 c/ branco ✅ AA */
--cta-hover:  #0C6E30;  /* hover / active           · 6,39:1 c/ branco ✅ AA */
--cta-ring:   #22C55E;  /* anel de foco — nunca texto · 8,45:1 vs escuro ✅ */
--cta-text:   #FFFFFF;
--cta-shadow: 0 6px 20px rgba(15,134,59,.32);
```

**Regra de isolamento (efeito Von Restorff).** O verde captura atenção
pré-atentiva **apenas** se for a única coisa verde da página. Portanto:
nenhum ícone, borda, badge, selo, check, divisor ou destaque em verde.
Verde = ação. Ponto.

Única exceção tolerada: o verde nativo do WhatsApp (`#25D366`) no rodapé —
lido pelo cérebro como *logotipo*, não como botão. Ver dobra 17.

### Superfícies

```css
/* escuro — hero, dobras de mecanismo e de oferta */
--ink-900: #0C0F0E;   /* fundo base                                  */
--ink-800: #131817;   /* cards sobre escuro                          */
--ink-700: #1C2321;   /* elevação 2                                  */
--line-dk: #2C3532;

/* claro — dobras de leitura longa (o que aprende, provas, FAQ)      */
--paper:   #FAF8F5;   /* off-white quente — nunca #FFF puro          */
--paper-2: #F1EDE7;
--line-lt: #E2DCD3;
```

**Por que alternar claro e escuro:** o escuro entrega peso e clima de evento;
o claro entrega legibilidade em texto longo — e a página tem MUITO texto longo.
Alternar também cria ritmo e marca a fronteira entre as dobras sem precisar de
divisores decorativos (menos DOM, menos CSS, mais performance).

### Texto

```css
--on-dark-hi:   #F6F4F1;  /* 17,54:1 ✅ */
--on-dark-mid:  #B9C0BB;  /* 10,38:1 ✅ */
--on-light-hi:  #14100C;  /* 17,86:1 ✅ */
--on-light-mid: #4A4741;  /*  8,73:1 ✅ */
```

### Destaque — dourado (nunca verde)

```css
--accent:      #C9A227;  /* badge RECOMENDADO · 7,96:1 sobre escuro ✅ */
--accent-ink:  #14100C;  /* texto sobre o badge · 7,83:1 ✅            */
--accent-soft: #F0E4BC;
```

### Urgência — terracota (nunca vermelho)

```css
--warm: #A94D29;  /* contador e "o valor sobe em…" · 5,24:1 sobre claro ✅ */
```

Vermelho puro em página de venda para essa persona lê como *pressão*, e o mapa
diz que ela detecta e pune inflação. Terracota carrega urgência sem agressão.

---

## 2. Tipografia

### Escolha

| Papel | Fonte | Peso | Arquivo |
|---|---|---|---|
| Display (H1, H2, números grandes) | **Fraunces** variável | 400–700, `opsz` | latin subset, woff2 |
| Texto (tudo o mais) | **Inter** variável | 400–700 | latin subset, woff2 |

Ambas **self-hosted** via `@fontsource-variable/*` (npm), copiadas no build.
Zero requisição ao Google Fonts — elimina 1 DNS + 1 TLS + 1 hop e remove a
dependência de terceiro no caminho crítico.

**Por que serifa no display:** a categoria inteira usa sans bold gritado.
Uma serifa editorial diferencia à primeira vista e sobe credibilidade percebida
— que é a variável que decide a compra de uma gestora de 44 anos com detector
calibrado por 20 anos de tentativas. Fraunces tem eixo óptico, então fica
robusta em corpo grande e não vira enfeite.

**Por que Inter no corpo:** x-height alta, formas abertas, excelente em 16–17px.
Fluência de processamento — texto fácil de ler é julgado como mais verdadeiro.

### Carregamento

- Só a **Fraunces** recebe `<link rel="preload">` — ela desenha o H1, que é o
  elemento de LCP.
- Inter entra com `font-display: swap` e fallback métrico (`size-adjust`) para
  **CLS zero** durante a troca.
- **Subset próprio.** `npm run fontes` roda `pyftsubset` sobre os arquivos do
  `@fontsource-variable` e corta os glifos que a página nunca vai usar,
  preservando o eixo de peso. O conjunto cobre o **português inteiro** — não só
  o texto atual — para que depoimentos e ajustes futuros nunca caiam em glifo
  faltando.

  | | original | subsetado | |
  |---|---|---|---|
  | Fraunces | 35,8 KB | **28,1 KB** | −22% |
  | Inter | 47,1 KB | **29,3 KB** | −38% |
  | **total** | 82,9 KB | **57,4 KB** | **dentro do orçamento de 75 KB** ✅ |

  Os `.woff2` gerados ficam versionados em `public/fonts/`, então o build do dia
  a dia não depende de Python nem de rede.

### Escala fluida

```css
--fs-display: clamp(2.5rem,  1.7rem  + 3.6vw, 4.75rem);
--fs-h1:      clamp(2.125rem,1.55rem + 2.6vw, 3.5rem);
--fs-h2:      clamp(1.625rem,1.35rem + 1.4vw, 2.5rem);
--fs-h3:      clamp(1.1875rem,1.1rem + 0.5vw, 1.4375rem);
--fs-lead:    clamp(1.0625rem,1rem   + 0.4vw, 1.3125rem);
--fs-body:    clamp(1rem,    0.975rem+ 0.15vw,1.0625rem);
--fs-sm:      0.9375rem;
--fs-xs:      0.8125rem;
```

### Medida de linha

```css
--measure:      62ch;  /* dentro da faixa 45–75 de fluência de leitura */
--measure-tight:46ch;  /* blocos de impacto e citações                */
```

---

## 3. Espaçamento, forma e movimento

```css
--s-1:.25rem; --s-2:.5rem;  --s-3:.75rem; --s-4:1rem;   --s-5:1.5rem;
--s-6:2rem;   --s-7:2.5rem; --s-8:3.5rem; --s-9:5rem;   --s-10:7rem;

--section-y: clamp(3.5rem, 2rem + 6vw, 7rem);
--wrap:       min(100% - 2.5rem, 68rem);
--wrap-narrow:min(100% - 2.5rem, 44rem);

--r-sm:8px; --r-md:14px; --r-lg:22px; --r-pill:999px;
--ease: cubic-bezier(.22,.61,.36,1);
```

### Movimento

- Só `opacity` e `transform`. Nada que dispare layout ou paint.
- Entrada por `IntersectionObserver`, 320–420ms, uma vez por elemento.
- `@media (prefers-reduced-motion: reduce)` desliga tudo — acessibilidade **e**
  performance.
- **Zero animação em loop.** Nada pulsando, nada piscando. Para esta persona,
  urgência artificial lê como armadilha.

---

## 4. Grid e responsividade

Mobile-first, **duas quebras apenas** — cada media query custa CSS.

| Faixa | Comportamento |
|---|---|
| < 720px | Coluna única. Cards empilhados. Barra fixa de compra ativa. |
| ≥ 720px | Grades de 2 colunas (2 caminhos, oferta, tríade em 3). |
| ≥ 1024px | `--wrap` cheio, tipografia no topo da escala. |

**CLS zero por construção:** toda imagem com `width`/`height`, todo acordeão com
altura reservada, o contador com `font-variant-numeric: tabular-nums` e largura
mínima fixa (senão os dígitos empurram o layout a cada segundo).

---

## 5. Acessibilidade — meta 100

- Todo par de cores verificado por cálculo (tabela acima).
- Anel de foco visível em **todos** os interativos: `outline: 3px solid var(--cta-ring); outline-offset: 3px`.
- Alvos de toque ≥ 44×44px.
- Hierarquia de headings sem saltos; um `<h1>` só.
- Acordeão do FAQ em `<details>/<summary>` nativo — semântica e teclado de graça,
  zero JavaScript.
- `lang="pt-BR"`, `alt` descritivo em toda imagem de conteúdo, `alt=""` nas decorativas.
- O contador anuncia mudanças em `aria-live="off"` (evita spam em leitor de tela)
  e tem um resumo textual acessível.

---

## 6. Orçamento de performance

| Recurso | Teto |
|---|---|
| HTML (comprimido) | 22 KB |
| CSS crítico inline | 14 KB |
| CSS diferido | 8 KB |
| JavaScript total | 5 KB |
| Fontes | 75 KB |
| Imagem do hero (mobile) | 55 KB |
| **Primeira dobra, total** | **≤ 120 KB** |
| Requisições até o LCP | ≤ 3 |

Metas: **LCP < 1,5s · CLS 0 · INP < 100ms · Lighthouse mobile 100/100/100/100.**
