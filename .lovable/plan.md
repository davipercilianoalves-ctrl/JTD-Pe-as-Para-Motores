## Sidebar retrátil + Precificação reorganizada

Dois ajustes complementares para liberar espaço e reduzir confusão visual na precificação.

### 1. Sidebar retrátil

**Comportamento:**
- Estado `collapsed` persistido em `localStorage` (`jtd:sidebar-collapsed`)
- Largura: `256px` expandida → `60px` recolhida (mostra só ícones)
- Botão dedicado de toggle no topo da sidebar (chevron «/»)
- Atalho de teclado: `Cmd/Ctrl + B`
- Transição suave (`transition-[width] duration-200 ease-out`)
- Em modo recolhido: nav items, "novo produto" e produtos viram só ícones com tooltip ao hover; busca/filtros/categorias somem
- Lista de produtos recolhida: avatar com 2 letras + tooltip mostrando nome e SKU
- O conteúdo principal flui automaticamente para preencher o espaço (já é `flex-1`)

**Arquivos:**
- `src/components/AppSidebar.tsx` — adicionar estado, botão, dois modos de render
- `src/lib/store.tsx` — opcional: mover `collapsed` para o store para reuso futuro (nesta rodada deixo local com `localStorage`)

### 2. Reorganização da Precificação

O cockpit atual está visualmente correto mas denso demais com tudo em três colunas + simulador. Plano de simplificação:

**a) Hierarquia em 2 linhas, não 3 colunas estreitas:**

```text
┌──────────────────────────────────────────────────────────────┐
│ HERO — Preço final · Lucro · Margem (grande)                │
│ Linha do desconto (slider + toggle compensar)                │
├─────────────┬───────────────────────────────────────────────┤
│ CUSTOS      │  4 CARDS DE PREÇO (cada um analisado):       │
│ editáveis   │  Preço Ideal • Mínimo seguro • Psicológico   │
│ por grupo   │  • Agressivo                                  │
│             │  Cada card mostra: preço, lucro real,        │
│             │  margem, status (verde/âmbar/vermelho) e     │
│             │  uma frase explicando quando usar.            │
├─────────────┴───────────────────────────────────────────────┤
│ PRA ONDE VAI SEU DINHEIRO (barras) + ALERTAS lado a lado    │
├─────────────────────────────────────────────────────────────┤
│ SIMULADOR DE CENÁRIOS (4 cards)                              │
└─────────────────────────────────────────────────────────────┘
```

**b) Cards de preço com análise individual** (novo — atende ao pedido):
Cada um dos 4 preços vira um card com:
- Valor grande
- Lucro líquido naquele preço (R$ + %)
- Status colorido (saudável / atenção / risco)
- **Frase explicativa em linguagem humana**, por exemplo:
  - **Preço ideal:** "Preço alvo. Entrega seu lucro de R$ 28,40 (28%) sem desconto."
  - **Mínimo seguro:** "Empate. Aqui você não ganha nem perde. Use só em queima de estoque."
  - **Psicológico:** "Termina em .99 — converte ~12% mais. Margem real: 26%."
  - **Agressivo:** "Limite que você definiu (15% OFF). Ainda lucra R$ 16,80."

**c) Engine adiciona análise por preço (`src/lib/pricing.ts`):**
Nova função `analyzePrice(p, price)` → `{ netProfit, marginPct, status, reason }`. O `computePricing` já calcula tudo; só precisamos derivar lucro/margem para cada um dos 4 valores e gerar a frase.

**d) Simplificação visual:**
- "Pra onde vai seu dinheiro" e "Resumo em linguagem humana" fundidos em um painel só (barras + 2 frases-chave embaixo)
- Alertas continuam, mas em linha horizontal abaixo, não empilhados na lateral
- Custos da esquerda ficam mais respirados sem competir com 3 colunas

### Arquivos afetados

- `src/components/AppSidebar.tsx` — sidebar retrátil
- `src/components/ProductWorkspace.tsx` — reorganizar `PricingSection` (cards de análise por preço, layout em linhas)
- `src/lib/pricing.ts` — adicionar `analyzePrice()` e helper `priceStatus()`

Sem mudanças em store, tipos ou outras seções.