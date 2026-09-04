# Documento 04 — Medição de performance

> Item 3 da revisão pós-consultoria: *"medir a velocidade de carregamento da página"*.
> Reproduza com `npm run medir`. Relatórios completos em `docs/medicao/`.

---

## Resultado

| | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| **Mobile** | **100** | **100** | **100** | **100** |
| **Desktop** | **100** | **100** | **100** | **100** |

### Core Web Vitals

| Métrica | Mobile | Desktop | Meta | |
|---|---|---|---|---|
| LCP | **1,21 s** | 0,32 s | < 1,5 s | ✅ |
| FCP | 0,91 s | 0,24 s | < 1,8 s | ✅ |
| Speed Index | 0,91 s | 0,24 s | < 3,4 s | ✅ |
| CLS | **0,0001** | 0,0017 | < 0,1 | ✅ |
| TBT | **0 ms** | 0 ms | < 200 ms | ✅ |
| Peso total | 72,6 KB | 72,6 KB | — | |

Condições da medição mobile: 4G lento simulado (150 ms de RTT, 1,6 Mbps) com
CPU 4× mais lenta — o padrão do Lighthouse, mais pesado que o celular real da
maioria das compradoras.

---

## O caminho até aqui — o que a medição encontrou e como foi corrigido

A primeira rodada deu **95 em mobile** e **95 de acessibilidade**. Cinco
correções, cada uma a partir de um apontamento concreto do relatório:

### 1 · `<dl>` inválido — acessibilidade 95 → 100
O bloco 93%/7% tinha um `<p>` como filho direto de `<dl>`, o que não é HTML
válido e reprova a auditoria de estrutura. O parágrafo virou irmão do `<dl>`,
com o visual costurado por CSS.

### 2 · `will-change` em dezenas de elementos — TBT 264 ms → 84 ms
A regra `.reveal` declarava `will-change: opacity, transform`. Com mais de
trinta elementos animados, isso cria uma camada de composição para **cada um** —
custo de memória e de main thread sem ganho, já que a animação é curta e
disparada por `IntersectionObserver`. Removido.

### 3 · `backdrop-filter` na barra fixa — parte do mesmo TBT
`backdrop-filter: blur(10px)` força recomposição a cada scroll. Trocado por
fundo sólido. Visualmente a diferença é mínima; no perfil de CPU, não.

### 4 · Fonte de display com `swap` → `optional`
A Fraunces é pré-carregada e desenha o H1. Com `swap`, ela podia trocar depois
da primeira pintura e deslocar o layout. Com `optional`, ou chega antes da
pintura ou não entra naquele carregamento — nunca troca depois.

### 5 · A pilha de fontes do corpo — CLS 0,0158 → 0,0001
**A correção de maior impacto, e um erro sutil.**

O sistema define uma face `'Inter fallback'` com métricas ajustadas
(`size-adjust: 107.4%`, `ascent-override`, `descent-override`) justamente para
que a troca da Inter não mude a altura do texto. Só que ela estava declarada
**no fim** da pilha:

```css
font-family: 'Inter', -apple-system, …, Arial, sans-serif, 'Inter fallback';
                                                            ↑ nunca chega aqui
```

O navegador parava em Arial. A face ajustada nunca era usada, e a troca da fonte
mudava a altura do parágrafo do hero — empurrando os selos, o CTA e a foto
junto. Diagnosticado com `npm run cls`, que instrumenta a API de `layout-shift`
e imprime os elementos que se moveram:

```
  CLS total observado: 0.0158  (1 deslocamento)
  0.0158
      ul.selos       «3 dias ao vivo com Aline Bitton…»
      div.cta        «Garantir minha vaga / Lote Especial · R$ 27…»
      figure.hero__foto
```

Com o fallback movido para logo depois da Inter, o mesmo diagnóstico devolve
**0,0001**.

### 6 · Contador sem largura reservada
Dos três contadores da página, um tinha a classe no próprio elemento
(`<b class="contador">`) em vez de num filho — e o seletor `.contador b` não o
alcançava. Ficava sem `min-width`, então empurrava o texto ao redor quando o
timer substituía o travessão. O seletor passou a mirar `[data-cd]` diretamente.

---

## O que continua abaixo de 90 (e por que não é problema)

**"Network dependency tree"** — auditoria informativa, não pontua. Ela apenas
desenha a cadeia de requisições. A nossa tem profundidade 2: HTML → fontes.

---

## Cuidado ao remedir

**Meça com a máquina ociosa.** Numa rodada com o servidor de desenvolvimento
ligado em paralelo, o mobile caiu para **99 com TBT de 115 ms** — sem nenhuma
mudança de código. O Lighthouse simula CPU 4× mais lenta, então qualquer
processo competindo por CPU entra direto na conta. Desligado o servidor, o
mesmo build voltou a 100 com TBT 0.

Se um número piorar de repente, confira `uptime` antes de sair caçando
regressão no código.

## Como a medição é feita

`scripts/medir.mjs` sobe o `dist/` num servidor local que **comprime com gzip**,
como a Cloudflare faz em produção. Sem isso, a auditoria de latência mediria um
cenário que o site real nunca vai servir, e o número sairia pessimista de mentira.

`scripts/cls.mjs` é o diagnóstico de deslocamento: abre a página em Chromium
com um `PerformanceObserver` de `layout-shift` e imprime, para cada
deslocamento, o valor e os elementos que se moveram — com classe e trecho do
texto. É o que transforma "CLS 0,0158" em "o parágrafo do hero está empurrando
os selos".

---

## Orçamento de peso (verificado a cada build)

```
  ok    CSS minificado           16,9 KB / 22,0 KB
  ok    JS minificado             2,0 KB /  5,0 KB
  ok    index.html cru           47,5 KB / 64,0 KB
  ..    index.html gzip          14,0 KB
  ok    index.html brotli        12,4 KB / 14,0 KB
  ..    fontes (woff2)           57,4 KB
  ---------------------------------------------------
  ok    TRANSFERENCIA 1a dobra   69,8 KB / 120,0 KB
```

O build **falha** se qualquer teto for estourado. Não é um número num documento:
é um portão.

As 14 imagens de prova social ficam fora desse orçamento porque são
`loading="lazy"` e vivem bem abaixo da primeira dobra — não entram no caminho
crítico nem no LCP.
