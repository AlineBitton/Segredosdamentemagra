# Documento 09 — Redesenho sobre a identidade da marca

> Escrito depois de receber o guia de identidade visual, o manual do método e
> a referência de layout. **A página anterior estava errada** — não de acabamento,
> de fundação.

---

## 1. O que eu tinha feito errado

| | O que eu fiz | O que o guia manda |
|---|---|---|
| Paleta | Verde-preto `#0C0F0E` + dourado + verde ácido | **Cinco cores, nenhuma a mais**: ameixa, barro, papel cru, linho, cacau |
| Degradê | Radial no hero | *"Sem degradê, em nenhuma circunstância."* |
| Caixa alta | Etiquetas com espaçamento de letra | *"Nada de caixa alta em bloco."* |
| Negrito | 33 `<strong>` | *"A hierarquia se faz por tamanho e por espaço, nunca por negrito."* |
| Entrelinha dos títulos | 1,16 | *mínimo 1,3* |
| Numeração | Cards 01…05 | Não é sequência — é lista |
| Elemento proprietário | Nenhum | **A linha** e **a espiral** existem e eu não usei |
| Léxico | "autossabotagem", "transformação" | Tabela de substituições obrigatórias |

Sem o guia, produzi o que a própria pergunta de controle dele reprova:
*"Esta peça poderia ter sido feita por qualquer outra profissional de
emagrecimento?"* — poderia.

---

## 2. Uma tensão que precisa ser nomeada

A skill de design da Anthropic lista, entre os padrões que denunciam página
gerada por IA, exatamente isto:

> *"fundo creme quente (perto de #F4F1EA) com display serifado de alto contraste
> e acento terracota."*

Que é, literalmente, papel cru + Fraunces + barro. A mesma skill resolve:
**"onde o briefing fixa uma direção visual, siga à risca — as palavras do
briefing sempre vencem."**

Então a paleta não é onde a página se diferencia. A diferenciação tem que vir
de outro lugar — e o guia entrega esse lugar de bandeja: **a linha** e
**a espiral**, que são propriedade da marca e que ninguém mais tem.

---

## 3. O conceito: a página é a espiral

Do manual do método:

> *"O desenho não é funil nem linha reta. É uma espiral. Cada volta passa pelos
> mesmos temas num patamar mais alto. Nenhuma volta termina no ponto de partida.
> A persona vive com o script do 'voltei à estaca zero'. A espiral é a única
> geometria que torna essa frase literalmente falsa."*

A página passa a **fazer** isso, não só a dizer:

- **A linha da marca é a espinha da página.** Um único traço contínuo desce a
  página inteira, mudando de amplitude a cada dobra. O guia manda usar a linha
  *uma vez por peça* — uma linha só, do topo ao rodapé, cumpre a regra numa
  escala que nenhum carrossel alcança.
- **A amplitude marca a posição.** Onde a leitora está na travessia se lê pelo
  desenho, não por um número `01 / 02 / 03` — que a skill de design aponta como
  marcador genérico quando o conteúdo não é sequência.
- **A espiral abre a página.** É a coisa mais característica do mundo da Aline,
  e é o que a skill pede que apareça primeiro.

## 4. Tokens

```
--ameixa   #5E3A46   destaque, ênfase, título de força
--barro    #9E5C42   traço, ícone, título grande — nunca texto de leitura, nunca fundo
--papel    #F2EDE5   campo dominante
--linho    #E7DED0   alternância e blocos
--cacau    #3A322C   texto; e o bloco escuro que ancora começo e fim
--verde    #2F6B44   exclusivo do botão (ver §5)
```

Contraste medido, e bate com o que o guia afirma:
cacau/papel **10,77:1** · ameixa/papel **8,31:1** · barro/papel **4,43:1** (só título).

**Achado que o guia não cobre:** barro sobre cacau dá **2,43:1** e reprova.
Em bloco escuro, o traço tem que ser linho.

**Tipografia:** Fraunces (títulos) · Jost (assinatura e etiqueta) · Inter (corpo).
Sem caixa alta, sem negrito pesado, entrelinha 1,3 em título e 1,6 no corpo,
alinhamento à esquerda — centralizado só na abertura e no fechamento.

## 5. O verde do botão — decisão consciente

O guia diz *"nenhuma cor nova entra"* e que o botão é ameixa. Mas você pediu
CTA verde, e a sua própria referência de layout usa verde. Resolução:

**O verde fica, e é a única cor fora da paleta na página inteira.**
Trocado de `#0F863B` (ácido, brigava com o warm) por **`#2F6B44`** — verde de
mata, 6,35:1 com branco, que convive com ameixa e barro em vez de gritar sobre
eles. Continua sendo a única coisa verde: efeito de isolamento intacto.

## 6. ⚠️ Conflito que só você pode resolver

O guia proíbe, em texto e na lista de verificação final:

> *"Alguma coisa aqui **mede o corpo dela** — número, seta, balança, silhueta,
> **antes e depois**?"*
> Na lista do que evitar: *"Antes e depois, colagem de clientes, número de quilos."*
> E o motivo: *"A mulher que lê esse conteúdo passa o dia inteiro medindo a si
> mesma. Uma peça que mede reproduz o problema que a marca promete resolver."*

E você me mandou o Canva com **14 antes e depois com quilos** para a dobra de provas.

Os dois materiais são seus e se contradizem. **A sua referência de layout resolve
a favor do guia**: nela a prova social são três depoimentos em texto, com iniciais
e idade — nenhum corpo, nenhum quilo.

**Recomendação:** seguir o guia e a sua referência — prova em texto. Deixo o grid
de fotos pronto atrás de uma chave no config, para você ligar se decidir o contrário.
Preciso, nesse caso, dos depoimentos em texto.

## 7. O léxico do método entra no lugar do que eu inventei

O manual tem vocabulário próprio, e é melhor que o meu:

| Do método | Onde entra |
|---|---|
| **A Espiral** | Abertura e espinha da página |
| **Recalculando** | *"O GPS é o modelo emocional exato: não julga, não pergunta por que você errou, não pede desculpa. Só recalcula."* |
| **Ponto de Afinação** | **É o nome do VIP** — e está na sua referência: "Ponto de Afinação Individual, 50 min com Aline" |
| **Saber voltar** | *"O Ponto B não é nunca mais sair do plano. É saber voltar, e voltar rápido."* |

O "Diagnóstico Completo" que eu tinha proposto sai: o nome certo já existia.

**Regra de linguagem do método:** sempre o verbo *estar*. Nunca "você conseguiu"
ou "você não conseguiu". Sempre "você **está** em ___".
