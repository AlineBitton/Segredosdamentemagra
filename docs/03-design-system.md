# Sistema visual

Este documento descreve o que está implementado em `src/styles/`. Ele segue o
guia de identidade da Afinando Corpo e Mente, e a regra que manda em tudo é a
de proporção — não a de gosto.

---

## 1. Proporção dos campos

> Papel cru domina. Linho aparece em alternância. Cacau ancora começo e fim.
> Barro e ameixa somados nunca ultrapassam um quarto da peça.

Como isso vira código: cada seção recebe uma classe de campo, e a classe define
o jogo inteiro de cor daquele trecho (`--bg`, `--txt`, `--realce`, `--rotulo`,
`--forte`, `--anel`).

| classe        | campo      | onde                                        |
|---------------|------------|---------------------------------------------|
| `.sup-clara`  | papel cru  | campo padrão da página                      |
| `.sup-linho`  | linho      | alternância, para dar respiro                |
| `.sup-escura` | cacau      | só a abertura e o fechamento                 |

Distribuição atual das 18 dobras:

```
abertura ........ cacau      ← âncora
faixa médica .... linho
estado atual .... papel
objeções ........ papel
3 dias .......... papel
emocional ....... linho
mecanismo ....... papel
para quem é ..... papel
para quem não é.. linho
provas .......... papel
Aline ........... linho
dois caminhos ... linho
oferta .......... papel
por que barato .. linho
garantia ........ papel
dúvidas ......... papel
suporte ......... cacau      ← âncora
rodapé .......... cacau      ← âncora
```

**9 campos de papel, 5 de linho, 3 de cacau** (dois deles contíguos, no fecho).

Cacau aparece mais duas vezes, e só como *cartão* dentro de campo claro:

- `.caminho--imersao` — o caminho que se propõe pesa mais que o outro;
- `.plano--vip` — peso visual como valor percebido, sem escurecer a dobra.

Nenhuma cor nova entra. A única exceção é o verde do botão, pedida em
consultoria e restrita ao botão — nunca a um campo, um traço ou um texto.

---

## 2. Cores

```
--papel   #F2EDE5   respiro · campo dominante
--linho   #E7DED0   respiro · alternância
--cacau   #3A322C   âncora  · abertura e fechamento
--ameixa  #5E3A46   título de força e leitura sobre papel
--barro   #9E5C42   traço, fio, marca — nunca parágrafo
```

Regras de leitura, direto do guia:

- **Texto de leitura só em cacau ou ameixa sobre papel cru. Nunca em barro.**
  Por isso `--rotulo` (a cor da etiqueta) é ameixa no claro, e não barro.
  Barro sobre papel dá 4,43:1 e reprova como texto — passa só como fio.
- Sobre cacau, barro precisa clarear: `--barro-claro #C09683` é a mesma cor
  40% em direção ao papel, e dá 4,74:1.
- **Sem degradê, em nenhuma circunstância.** Não existe `gradient` no CSS.

`npm run contraste` lê os tokens do próprio `tokens.css` e calcula os 25 pares
do sistema. Trocar uma cor quebra o teste em vez de passar despercebido.

---

## 3. Tipografia

| papel      | família   | uso                                  |
|------------|-----------|--------------------------------------|
| título     | Fraunces  | `.titulo`, `h2`, nomes de cartão      |
| subtítulo  | Jost      | `h3`, `.etiqueta`, botão, contador    |
| corpo      | Inter     | todo texto de leitura                 |

- **Nada de caixa alta em bloco.** Não existe `text-transform: uppercase` no
  projeto. A distinção da etiqueta vem de tamanho, entressilábico (`.17em`) e
  cor de rótulo.
- **Nada de bold.** O teto de peso é 500 (`--p-medio`), e ele existe só onde a
  função exige: botão, etiqueta, numeral. Todo o resto é 400 (`--p-regular`).
  Não existe peso abaixo de 400.
- **Entrelinha generosa:** `--lh-corpo: 1.6` no texto corrido, `--lh-titulo` e
  `--lh-h2` em `1.3`.
- **Medida:** `--medida: 45ch`. `p { max-width: var(--medida) }` vale para a
  página inteira; listas e itens repetem a regra.
- **Alinhamento à esquerda.** Centralizado só na capa (a barra fixa e o campo
  de retrato) e no fechamento (`.suporte`).

As três fontes são variáveis, subsetadas para o português inteiro
(`npm run fontes`), servidas do próprio domínio, e somam 77,7 KB.

Fraunces carrega com `font-display: optional` — se não chegar a tempo, a
página usa a serifa do sistema e nada desloca. Jost e Inter carregam com
`swap` e têm par métrico (`'Jost fallback'`, `'Inter fallback'`, derivados da
Arial por `size-adjust`), então a troca não muda largura nem altura de linha.
Sem esse par a CLS de desktop ia a 0,0418.

---

## 4. Armações de layout

Duas, e só duas. Ambas mantêm a linha em 45 caracteres — a largura da tela é
ocupada por estrutura, nunca por linha esticada.

**`.trilho`** — título num corredor à esquerda (27rem), texto à direita.
Usada em: objeções, mecanismo, para quem é, para quem não é, por que custa
barato, garantia, dúvidas.

```
┌──────────────┬──────────────────────────────┐
│ título       │ texto de leitura (45ch)      │
└──────────────┴──────────────────────────────┘
```

**`.dobra`** — texto de leitura à esquerda, coluna de margem à direita.
Usada na dobra de estado atual: o argumento de um lado, a pergunta que ela
carrega e as cinco cenas de reconhecimento do outro.

```
┌────────────────────────┬────────────────────┐
│ h2 + parágrafos        │ “E quando eu       │
│ destaque               │  parar?”           │
│ CTA                    │  ── cinco cenas    │
└────────────────────────┴────────────────────┘
```

Fora delas: `.cards` é uma pauta de fios no mesmo trilho de 27rem (grade de
cartões deixaria a sexta célula vazia), e `.proporcao__grade` põe os dois
números do 93/7 ao lado da leitura deles.

Dois campos de papel em seguida ganham um fio de linho na divisa
(`.sup-clara + .sup-clara`), senão a dobra some.

---

## 5. Espaço e forma

```
--secao-y  clamp(4rem, 2.5rem + 5vw, 7.5rem)
--wrap         min(100% - 2.5rem, 74rem)
--wrap-narrow  min(100% - 2.5rem, 44rem)
--r-pill   999px   (só o botão)
--r-sm/md  2px/3px (nada mais tem canto arredondado)
```

Sem sombra em lugar nenhum. A separação é por campo de cor e por fio de 1px.

---

## 6. Movimento

Um só: `.reveal` sobe 14px e aparece, uma vez, quando entra na tela. Nada de
hover animado em cartão, nada de paralaxe. `prefers-reduced-motion` desliga
tudo — inclusive a transição da barra fixa e o `+` do FAQ.

---

## 7. Orçamento

| item                  | teto    | atual   |
|-----------------------|---------|---------|
| CSS minificado        | 25 KB   | 21,6 KB |
| JS minificado         | 5 KB    | 2,8 KB  |
| index.html brotli     | 14 KB   | 13,5 KB |
| fontes woff2          | 80 KB   | 77,7 KB |
| **transferência 1ª dobra** | **120 KB** | **91,3 KB** |

`npm run build` falha se qualquer linha estourar.
