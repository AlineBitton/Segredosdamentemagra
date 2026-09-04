import { writeFileSync, readFileSync } from 'node:fs';
const C = JSON.parse(readFileSync('caminhos.json', 'utf8'));

const P = { ameixa: '#5E3A46', barro: '#9E5C42', papel: '#F2EDE5', linho: '#E7DED0', cacau: '#3A322C' };

/* Cada direção entrega: a marca em tamanho grande, a mesma reversa sobre
   cacau, e o teste de 28 px — que é onde a maioria das marcas morre. */
const marca = {
  espiralMini: (cor, h) => `<svg viewBox="0 0 200 200" style="height:${h}px;width:${h}px;flex:none" fill="none" aria-hidden="true"><path d="${C.espiralMini}" stroke="${cor}" stroke-width="${(3.2 * 200 / h).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${C.espiralMiniFim[0]}" cy="${C.espiralMiniFim[1]}" r="${(5.2 * 200 / h).toFixed(2)}" fill="${cor}"/></svg>`,
  espiral: (cor, h) => `<svg viewBox="0 0 200 200" style="height:${h}px;width:${h}px;flex:none" fill="none" aria-hidden="true"><path d="${C.espiral}" stroke="${cor}" stroke-width="${(2.6 * 200 / h).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${C.espiralFim[0]}" cy="${C.espiralFim[1]}" r="${(4.4 * 200 / h).toFixed(2)}" fill="${cor}"/></svg>`,
  onda: (cor, h) => `<svg viewBox="0 0 420 56" style="height:${h}px;width:${(h * 420 / 56).toFixed(0)}px;flex:none" fill="none" aria-hidden="true"><path d="${C.ondaLarga}" stroke="${cor}" stroke-width="${(2.6 * 56 / h).toFixed(2)}" stroke-linecap="round"/></svg>`,
  ponto: (cor, h) => `<svg viewBox="0 0 320 24" style="height:${h}px;width:${(h * 320 / 24).toFixed(0)}px;flex:none" fill="none" aria-hidden="true"><path d="${C.linha}" stroke="${cor}" stroke-width="${(1.9 * 24 / h).toFixed(2)}" stroke-linecap="round"/><circle cx="${C.ponto[0]}" cy="${C.ponto[1]}" r="${(4.6 * 24 / h).toFixed(2)}" fill="${cor}"/></svg>`,
  rota: (cor, h) => `<svg viewBox="0 0 360 96" style="height:${h}px;width:${(h * 360 / 96).toFixed(0)}px;flex:none" fill="none" aria-hidden="true"><g stroke="${cor}" stroke-width="${(2.4 * 96 / h).toFixed(2)}" stroke-linecap="round" fill="none"><path d="${C.rotaPrincipal}"/><path d="${C.rotaDesvio}"/><path d="${C.rotaCont}"/></g><circle cx="${C.rotaRetorno[0]}" cy="${C.rotaRetorno[1]}" r="${(4.2 * 96 / h).toFixed(2)}" fill="${cor}"/></svg>`,
  regua: (cor, h) => `<svg viewBox="0 0 360 22" style="height:${h}px;width:${(h * 360 / 22).toFixed(0)}px;flex:none" fill="none" aria-hidden="true"><path d="${C.ondaBaixa}" stroke="${cor}" stroke-width="${(1.8 * 22 / h).toFixed(2)}" stroke-linecap="round"/></svg>`,
};

/* Assinatura da marca, em Jost minúsculo — como o guia define */
const assinatura = (cor) =>
  `<div style="font-family:Jost,'Century Gothic',sans-serif;font-size:13px;letter-spacing:.10em;color:${cor};line-height:1.3">afinando corpo e mente</div>`;

/* Nome do evento. Sem caixa alta: o guia proíbe, e minúscula é o que a
   assinatura da marca já faz. */
const nome = (cor, tam, gap = 6) => `
      <div style="display:flex;flex-direction:column;gap:${gap}px">
        <div style="font-family:Jost,'Century Gothic',sans-serif;font-size:${(tam * 0.30).toFixed(0)}px;letter-spacing:.16em;color:${cor};line-height:1">segredos da</div>
        <div style="font-family:Fraunces,Georgia,serif;font-size:${tam}px;font-weight:400;letter-spacing:-.015em;color:${cor};line-height:1.05">mente magra</div>
      </div>`;

const DIRECOES = [
  {
    arquivo: 'Main.dc.html', letra: 'A', titulo: 'Espiral',
    simbolo: 'espiral', vertical: true, hGrande: 132, hReverso: 62, hMini: 28,
    porque: 'Curva aberta que não fecha. O olho completa o movimento sozinho — e é a única geometria que contradiz “voltei à estaca zero” sem precisar de uma palavra.',
    custo: 'Precisa continuar lendo como espiral: fechada demais vira círculo concêntrico, que o guia proíbe.',
  },
  {
    arquivo: 'Afinacao.dc.html', letra: 'B', titulo: 'Afinação',
    simbolo: 'onda', vertical: false, hGrande: 52, hReverso: 30, hMini: 14,
    porque: 'A linha da marca em amplitude crescente. O desvio à mão em cada onda é lido como feito por pessoa — simetria perfeita demais é o que denuncia máquina.',
    custo: 'Excelente em tamanho grande. É a que mais perde aos 28 px.',
  },
  {
    arquivo: 'Ponto.dc.html', letra: 'C', titulo: 'Ponto de Afinação',
    simbolo: 'ponto', vertical: false, hGrande: 30, hReverso: 20, hMini: 12,
    porque: 'Um ponto cheio numa linha nua é a figura mais rápida de reconhecer do conjunto: vista antes de ser lida. E diz posição, nunca nota — que é a regra do próprio método.',
    custo: 'A mais abstrata das cinco. Não funciona sozinha, sempre precisa do nome ao lado.',
  },
  {
    arquivo: 'Rota.dc.html', letra: 'D', titulo: 'Rota',
    simbolo: 'rota', vertical: false, hGrande: 76, hReverso: 44, hMini: 22,
    porque: 'Um caminho que sai da linha, desvia e volta. Quem vê simula o movimento — é “saber voltar” desenhado, sem precisar dizer.',
    custo: 'Desenhada certinha demais, cai no clichê de jornada. Depende do desvio ser irregular.',
  },
  {
    arquivo: 'Tipografica.dc.html', letra: 'E', titulo: 'Tipográfica',
    simbolo: 'regua', vertical: false, hGrande: 22, hReverso: 14, hMini: 9, semSimbolo: true,
    porque: 'Sem símbolo: o nome é a marca. Não há nada a decifrar, o que a torna a mais legível em uma cor só e em tamanho mínimo — onde a maioria das marcas morre.',
    custo: 'Sem símbolo não sobra ícone isolado para avatar, perfil ou favicon.',
  },
];

const fontes = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Jost:wght@400;500&family=Inter:wght@400&display=swap">`;

for (const d of DIRECOES) {
  const m = marca[d.simbolo];
  // lockup grande: espiral empilha, as outras assentam a marca sob o nome
  const grande = d.vertical
    ? `<div style="display:flex;align-items:center;gap:44px">
        ${m(P.barro, d.hGrande)}
        <div style="display:flex;flex-direction:column;gap:18px">${nome(P.cacau, 52)}${assinatura(P.barro)}</div>
      </div>`
    : `<div style="display:flex;flex-direction:column;gap:22px;align-items:flex-start">
        ${nome(P.cacau, 52)}
        ${m(P.barro, d.hGrande)}
        ${assinatura(P.barro)}
      </div>`;

  const reverso = d.vertical
    ? `<div style="display:flex;align-items:center;gap:22px">${m(P.linho, d.hReverso)}<div style="display:flex;flex-direction:column;gap:9px">${nome(P.papel, 26, 4)}${assinatura(P.linho)}</div></div>`
    : `<div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">${nome(P.papel, 26, 4)}${m(P.linho, d.hReverso)}${assinatura(P.linho)}</div>`;

  const mMini = marca[d.simbolo + 'Mini'] || m;
  const mini = d.semSimbolo
    ? `<div style="display:flex;flex-direction:column;gap:3px"><div style="font-family:Jost,'Century Gothic',sans-serif;font-size:8px;letter-spacing:.16em;color:${P.cacau};line-height:1">segredos da</div><div style="font-family:Fraunces,Georgia,serif;font-size:15px;color:${P.cacau};line-height:1.05">mente magra</div></div>`
    : mMini(P.cacau, d.hMini);

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
    ${fontes}
  <style>
    body { margin: 0; }
    a { color: ${P.ameixa}; } a:hover { color: ${P.cacau}; }
  </style>
</helmet>
<div style="width:880px;height:640px;box-sizing:border-box;background:${P.papel};padding:56px 60px;display:flex;flex-direction:column;gap:0;font-family:Inter,system-ui,sans-serif">

  <div style="display:flex;align-items:baseline;gap:14px">
    <div style="font-family:Jost,'Century Gothic',sans-serif;font-size:12px;letter-spacing:.20em;color:${P.cacau};line-height:1">${d.letra}</div>
    <div style="font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:400;color:${P.ameixa};line-height:1.3">${d.titulo}</div>
  </div>

  <div style="flex-grow:1;display:flex;align-items:center;padding:34px 0">
    ${grande}
  </div>

  <div style="display:flex;gap:26px;align-items:stretch">
    <div style="flex-grow:1;background:${P.cacau};padding:26px 28px;display:flex;align-items:center;min-height:104px">
      ${reverso}
    </div>
    <div style="width:210px;flex:none;background:${P.linho};padding:20px;display:flex;flex-direction:column;justify-content:center;gap:12px">
      <div style="font-family:Jost,'Century Gothic',sans-serif;font-size:10px;letter-spacing:.14em;color:${P.cacau};line-height:1">teste de 28 px${d.simbolo === 'espiral' ? ' · variante reduzida' : ''}</div>
      <div style="display:flex;align-items:center;min-height:30px">${mini}</div>
    </div>
  </div>

  <div style="display:flex;gap:26px;padding-top:28px">
    <div style="flex-grow:1;font-size:14px;line-height:1.65;color:${P.cacau};max-width:52ch">${d.porque}</div>
    <div style="width:210px;flex:none;font-size:12px;line-height:1.6;color:${P.cacau};border-left:1px solid ${P.barro};padding-left:14px">${d.custo}</div>
  </div>

</div>
</x-dc>
</body>
</html>
`;
  writeFileSync(d.arquivo, html);
  console.log(`  ${d.arquivo.padEnd(20)} ${d.letra} · ${d.titulo}`);
}

const canvas = {
  artboards: [
    { file: 'Main.dc.html',        x: 0,    y: 0,   w: 880, h: 640 },
    { file: 'Afinacao.dc.html',    x: 980,  y: 0,   w: 880, h: 640 },
    { file: 'Ponto.dc.html',       x: 1960, y: 0,   w: 880, h: 640 },
    { file: 'Rota.dc.html',        x: 490,  y: 780, w: 880, h: 640 },
    { file: 'Tipografica.dc.html', x: 1470, y: 780, w: 880, h: 640 },
  ],
  annotations: [{
    id: 'restricoes', x: 0, y: -230, w: 700,
    text: 'Cinco direções para a marca do evento.\n\nTodas dentro do guia: só as cinco cores da marca, traço fino sem preenchimento, formas abertas, sem caixa alta, sem negrito, sem degradê.\n\nFora, por decisão do guia: cérebro, balança, borboleta, lótus, círculo concêntrico e qualquer coisa que meça o corpo dela.\n\nO traço nunca é ameixa — ameixa é destaque, não é ícone.',
  }],
  launch: { view: 'canvas' },
};
writeFileSync('canvas.json', JSON.stringify(canvas, null, 2));
console.log('  canvas.json          5 artboards + 1 nota');
