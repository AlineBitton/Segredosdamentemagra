#!/usr/bin/env python3
"""
Gera os woff2 subsetados que a página usa.

Rode apenas quando trocar de fonte — os arquivos gerados ficam versionados em
public/fonts/, então o build do dia a dia não depende de Python nem de rede.

O conjunto de glifos cobre o português inteiro (não só o texto atual), para que
depoimentos e ajustes de copy futuros nunca caiam em glifo faltando.
"""
import subprocess, pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'public' / 'fonts'
SAIDA.mkdir(parents=True, exist_ok=True)

ascii_basico = ''.join(chr(c) for c in range(0x20, 0x7F))
portugues = (
    'ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ'
    'àáâãäçèéêëìíîïñòóôõöùúûüýÿ'
    'ªº'
)
tipografia = (
    '‘’“”'
    '–—'
    '…'
    '   '
    '•·'
    '×→✓✗'
    '€£™®©'
    '°−½¼¾'
    '★☆'
)
TEXTO = ascii_basico + portugues + tipografia

FONTES = [
    ('fraunces', 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2', 'fraunces-var.woff2'),
    ('inter',    'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',       'inter-var.woff2'),
]

def kb(p): return f'{p.stat().st_size / 1024:.1f} KB'

total_antes = total_depois = 0
for nome, origem, destino in FONTES:
    src = RAIZ / origem
    if not src.exists():
        sys.exit(f'ERRO: fonte nao encontrada: {src}\nRode `npm install` antes.')
    dst = SAIDA / destino
    cmd = [
        sys.executable, '-m', 'fontTools.subset', str(src),
        f'--text={TEXTO}',
        '--flavor=woff2',
        f'--output-file={dst}',
        '--layout-features=kern,liga,calt,tnum',
        '--no-hinting',
        '--desubroutinize',
        '--drop-tables+=DSIG',
        '--name-IDs=1,2,3,4,6',
        '--notdef-outline',
    ]
    subprocess.run(cmd, check=True)
    a, d = src.stat().st_size, dst.stat().st_size
    total_antes += a; total_depois += d
    print(f'  {nome:<10} {kb(src):>9}  ->  {kb(dst):>9}   (-{100 - d * 100 // a}%)')

print(f'\n  total      {total_antes/1024:.1f} KB  ->  {total_depois/1024:.1f} KB')
print(f'  {"OK" if total_depois <= 75*1024 else "ESTOUROU"} orcamento de fontes: 75 KB\n')
