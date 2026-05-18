
# Plano de refatoração — JTD Motors Hub

Foco: corrigir bugs do fluxo de palavras-chave, redesenhar Títulos, Descrição e Vídeos. Pricing fica como está (você ajusta depois).

---

## 1. Palavras-chave (corrigir + redesenhar)

**Problemas hoje**
- Palavras extraídas de concorrentes não estão entrando na lista principal de forma confiável.
- O chip flow polui visualmente quando a lista cresce e some quando você rola — sem alta visibilidade nos campos onde elas são usadas (títulos / descrição).
- Não dá pra copiar só algumas — só "tudo".

**Como vai ficar**

Layout em duas colunas dentro de uma faixa contínua:

```
┌────────────────────────────────── Palavras-chave ──────────────────────────────────┐
│  + adicionar palavra…           [Todas] [Favoritas]    12 palavras   [Copiar tudo] │
│                                                                                    │
│  ☐ vedação motor          ×24    │   Selecionadas (3)                              │
│  ☐ junta cabeçote         ×18    │   • vedação motor                               │
│  ☑ alta temperatura       ×12    │   • junta cabeçote                              │
│  ☐ retentor virabrequim   ×9     │   • silicone vermelho                           │
│  ☑ silicone vermelho      ×7     │                                                 │
│  …                               │   [Copiar selecionadas]  [Limpar]               │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- **Lista vertical** de palavras com checkbox + contador de uso + estrela favoritar + remover (hover). Cabe 8–10 visíveis sem scroll, scroll interno suave a partir daí — alta legibilidade, zero poluição.
- **Coluna direita "Selecionadas"**: marque com checkbox e copie só essas. Resolve o "copiar tudo ou apenas algumas".
- **Sticky mini-barra** quando você rolar para baixo (até Títulos/Descrição): mostra um resumo `[12 palavras-chave ▾]` que abre um popover com a lista completa, para usar enquanto escreve título ou descrição **sem precisar voltar para o topo**.
- Filtro Todas / Favoritas mantido.
- Bug fix: garantir que `addKeywordTokens` é chamado de forma estável em `CompetitorKeywords` (estado controlado pode estar perdendo o último token no blur). Vou:
  - normalizar via `canonKeyword` antes de comparar,
  - sempre chamar `onCommit` mesmo se a palavra já existir localmente (para incrementar `uses` na lista global),
  - garantir commit no Enter, vírgula, espaço **e** blur com flush síncrono.

---

## 2. Análise de concorrentes

Estrutura visual fica. Apenas o bloco "Palavras-chave encontradas" passa a:
- Confirmar visualmente que a palavra entrou na lista principal (chip pisca verde por 600ms ao adicionar).
- Botão pequeno `Enviar todas →` no canto do bloco, que força reenvio das palavras extraídas para a lista principal — resolve qualquer dessincronização passada.

---

## 3. Títulos (redesenho)

**Hoje**: lista vertical de linhas baixinhas, sem destaque, sem ajuda das keywords.

**Novo**: cada título vira um **card respirado**, focado em escrita:

```
┌─ SEO Forte ──────────────────────────────────── 47 / 60 ──[⧉ duplicar][⧉ copiar][×]┐
│                                                                                    │
│   Junta cabeçote vedação alta temperatura silicone vermelho                        │
│                                                                                    │
│   Palavras usadas:  ● vedação motor  ● alta temperatura  ● silicone vermelho       │
│   Sugestões:        + junta cabeçote   + retentor   + vedante                      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- Input grande (text-xl), contador grande à direita com cor (cinza → âmbar > 60 → vermelho > 80).
- **Highlight automático** das keywords presentes no título (chips verdes embaixo).
- **Sugestões clicáveis**: keywords da lista que ainda **não** estão no título — clique adiciona ao final. Isso transforma o título em algo operacional, não em campo de texto seco.
- Botão "+ variação" sempre visível abaixo, com as 5 variantes (SEO Forte / Conversão / Mobile / Curto / Completo) em pílulas pequenas.

---

## 4. Descrição (mudança estrutural pedida)

**Novo modelo de descrição em duas partes**, expostas explicitamente na UI:

```
┌─ Descrição breve (resumo + palavras-chave) ──────── [⧉ copiar] ──┐
│  Auto-gerada a partir das suas palavras-chave + você edita.       │
│  ────────────────────────────────────────────────────────────     │
│  [textarea pequeno, 3–4 linhas]                                   │
│  [+ Inserir todas as palavras-chave]  [+ Inserir favoritas]       │
└───────────────────────────────────────────────────────────────────┘

┌─ Descrição completa ─────────────────────────────── [⧉ copiar tudo] ─┐
│  Começa automaticamente com a "Descrição breve" acima               │
│  e continua com o restante.                                         │
│  ────────────────────────────────────────────────────────────────   │
│  [textarea grande, Notion-style]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

- Tipos: adicionar `shortDescription: string` em `MarketplaceData`.
- A **Descrição completa exibida/copiada** = `shortDescription + "\n\n" + description`. Visualmente mostro um divisor sutil "— Resumo acima —" no topo da área completa para deixar claro.
- Botão "Copiar tudo" copia o concatenado pronto pra colar no marketplace.
- Bullet points / SEO / Estratégia / Notas continuam abaixo como blocos auxiliares.

---

## 5. Vídeos (redesenho — vídeos do próprio anúncio)

Fica explícito que são vídeos **do anúncio do produto** (não a biblioteca viral).

Cada vídeo vira um cartão único e limpo, dividido em duas colunas:

```
┌─ Vídeo 1 — Vertical 9:16 ─────────────────────── [▶ player] [×] ┐
│ ESQUERDA (mídia)              │ DIREITA (conteúdo)              │
│ • upload arquivo de vídeo     │ • Roteiro    [auto-textarea]    │
│ • link externo                │ • Falas      [auto-textarea]    │
│ • upload áudio                │ • CTA        [input]            │
│ • thumb preview               │ • Notas de edição               │
└─────────────────────────────────────────────────────────────────┘
```

- Header com nome editável + plataforma (TikTok / Reels / Shorts / YouTube).
- Player inline quando há arquivo.
- Botão "+ Novo vídeo" estilo igual aos outros.
- Tudo num bloco — sem sub-abas.

---

## 6. Pricing

Sem alteração nesta rodada (a seu pedido).

---

## Detalhes técnicos

- `src/lib/types.ts`: adicionar `shortDescription: string` em `MarketplaceData` (default `""`); `migrateProduct` preenche `""` para produtos antigos.
- `src/lib/store.tsx`: nada estrutural; `addKeywordTokens` já existe e funciona — o fix do bug está no consumidor (`CompetitorKeywords`), não na store.
- `src/components/ProductWorkspace.tsx`: reescrever `KeywordsSection`, `CompetitorKeywords` (fix de commit), `TitlesSection` (com highlight + sugestões), `DescriptionSection` (com `shortDescription` + composição automática), `VideosSection` (layout dois-colunas).
- Adicionar componente `KeywordsFloatingBar` (sticky) acionado por scroll, reutilizando dados da store.
- Usar somente tokens semânticos do design system existente (`surface`, `surface-elevated`, `primary`, `warning`, etc.) — sem cores hardcoded.

---

## Ordem de execução

1. Tipos + migração (`shortDescription`).
2. Keywords (lista vertical + selecionadas + sticky bar) e fix do commit em concorrentes.
3. Títulos (cards + highlight + sugestões).
4. Descrição (breve + completa concatenada).
5. Vídeos (layout dois-colunas).

Aprovando, eu executo nessa ordem.
