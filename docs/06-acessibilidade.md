# Documento 06 — Acessibilidade

> `npm run a11y`. O Lighthouse dá 100 e isso é bom — mas ele só verifica o que
> dá para verificar sozinho: contraste, `alt`, rótulos, hierarquia. Ele não
> navega a página. Este script navega.

---

## O que o script faz que o Lighthouse não faz

| Verificação | Por que importa |
|---|---|
| **Ordem do Tab** | Percorre as 22 paradas e confere se o foco anda de cima para baixo. Foco que pula para trás desorienta. |
| **Foco visível em cada parada** | Mede o contorno computado em cada elemento focado, um por um. |
| **`<details>` pelo teclado** | Abre o acordeão por foco + Enter e confirma que o estado muda. |
| **Reflow a 320px e a 400% de zoom** | WCAG 1.4.10. Se estourar, nomeia os elementos culpados. |
| **Texto de link ambíguo** | Mapeia texto → destinos. O mesmo texto levando a lugares diferentes confunde quem navega por lista de links. |
| **Contador × leitor de tela** | Confere que os contadores **não** estão em região viva. |
| **Movimento reduzido** | Abre a página com a preferência ligada e confirma que o conteúdo aparece sem depender de animação. |

## Resultado

```
  ok   ordem do Tab             segue a leitura visual, de cima para baixo
  ok   foco visivel             contorno presente nas 22 paradas
  ok   atalho de teclado        a primeira tecla Tab leva direto aos ingressos
  ok   alvos de toque           todos com area suficiente
  ok   FAQ                      6 perguntas em <details> nativo
  ok   reflow em 320px          sem rolagem horizontal (WCAG 1.4.10)
  ok   reflow em 400% de zoom   sem rolagem horizontal (WCAG 1.4.10)
  ok   estrutura                exatamente um <h1>
  ok   hierarquia de titulos    sem saltos de nivel
  ok   imagens                  17 imagens, todas com alt
  ok   idioma                   lang="pt-BR"
  ok   marcos de pagina         <main> e <footer> presentes e unicos
  ok   secoes                   toda <section> tem nome acessivel
  ok   texto de link            nenhum texto repetido com destinos diferentes
  ok   contador                 sem aria-live
  ok   movimento reduzido       conteudo visivel de imediato

  0 erro(s), 0 aviso(s)
```

---

## Três correções que a auditoria encontrou

### 1 · O atalho de pular ficava invisível mesmo com o foco nele

A página tem, como primeiro elemento, um link "Ir direto para os ingressos" —
ele existe para que alguém que navega por teclado não precise passar por 20
paradas até chegar na oferta.

Só que ele usava a classe de "esconder visualmente", **sem estado de foco**.
Resultado: quem enxerga e navega por teclado apertava Tab e o foco simplesmente
sumia da tela. É falha de **WCAG 2.4.7 — Foco Visível**, e nenhuma auditoria
automática pega, porque o link *tem* contorno; ele só está fora da área visível.

Agora ele aparece como um botão verde no canto superior esquerdo assim que
recebe foco (`docs/capturas/atalho-teclado.png`).

### 2 · Links do rodapé com alvo de 19 pixels

"Termos de uso" e "Política de privacidade" tinham a altura do texto puro.
Ganharam `padding-block`, chegando a 40px — acima dos 24px de
**WCAG 2.5.8** — sem mudar nada visualmente.

### 3 · O contador era críptico no leitor de tela

Quem enxerga lê `5d 09h 19m 52s` e entende. Um leitor de tela anuncia
"5 d 0 9 h 1 9 m 5 2 s", que não diz nada.

Acrescentada, escondida ao lado do contador, uma frase que o próprio motor de
lotes gera:

> *O Lote Especial termina em 9 de setembro, às 23h59, no horário de Brasília.*

Ela vem do build e da borda, então acompanha a virada de lote sozinha.

---

## Decisões de acessibilidade que já estavam na página

- **FAQ em `<details>/<summary>` nativo.** Teclado, leitor de tela e
  funcionamento sem JavaScript vêm de graça. Um acordeão feito à mão exigiria
  `aria-expanded`, `aria-controls`, gerência de foco — e quebraria sem JS.
- **O contador não é região viva.** Marcar `aria-live` num relógio faz o leitor
  de tela anunciar a cada segundo, o que torna a página inutilizável. Por isso
  ele é mudo, e o prazo por extenso entrega a informação de uma vez.
- **`prefers-reduced-motion` desliga toda a animação de entrada** — e os
  elementos aparecem imediatamente, em vez de ficarem invisíveis.
- **Nenhuma informação depende só de cor.** O badge "Recomendado" tem texto; o
  lote vigente tem nome escrito; a coluna recomendada dos "2 caminhos" tem
  número e título.
- **Contraste verificado por cálculo**, não a olho — `npm run contraste`.
