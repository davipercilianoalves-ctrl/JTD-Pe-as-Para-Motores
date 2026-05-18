## Pricing Cockpit — Reformulação completa

Transformar a aba **Precificação** num cockpit operacional estratégico, com custos editáveis, resultados massivos no centro, painel analítico humano e simulador de desconto "falso" matematicamente correto.

### 1. Modelo de dados (`src/lib/types.ts`)

Substituir o `PricingData` rígido por um modelo flexível:

```ts
type CostKind = "currency" | "percent";        // R$ fixo ou % do preço
type PercentBase = "final" | "cost";           // % aplicado sobre o preço final ou sobre o custo base

interface CostItem {
  id: string;
  label: string;          // editável, linguagem humana
  kind: CostKind;
  value: number;
  base?: PercentBase;     // só p/ percent (default "final")
  group: "produto" | "logistica" | "marketing" | "taxas" | "outros";
  note?: string;
}

interface PricingData {
  items: CostItem[];                 // tudo aqui — totalmente editável
  desiredProfit: number;             // "Quanto de lucro você quer ter?"
  desiredProfitKind: CostKind;       // R$ ou %
  visibleDiscount: number;           // % que aparece pro cliente ("20% OFF")
  maxDiscount: number;               // limite de segurança
  compensateDiscount: boolean;       // liga o "desconto falso"
  scenarios: number[];               // % p/ simulador (default [10,15,20,25])
}
```

`migrateProduct` converte o `PricingData` antigo (cost/shipping/.../markup) em `items[]` + `desiredProfit` (a partir do markup) preservando os valores existentes.

### 2. Engine de cálculo (`src/lib/pricing.ts` — novo)

Função pura `computePricing(p: PricingData)` que retorna:

- `baseCost` — soma de todos custos em R$ + custos % com base `cost`
- `feesPct` — soma de custos % com base `final` (taxas, comissão, imposto)
- `idealPrice` — preço alvo que entrega `desiredProfit` líquido depois de `feesPct`:
  `idealPrice = (baseCost + lucroAlvoR$) / (1 - feesPct)`
- `minSafePrice` — preço onde lucro líquido = 0
- `displayedPrice` — preço "de" mostrado (quando `compensateDiscount` ativo)
- `finalPrice` — preço final cobrado depois do desconto visível
- `aggressivePrice` — preço com `maxDiscount` aplicado
- `netProfit`, `marginPct`, `breakdown[]` (cada item com R$ consumido e % do preço final)
- `alerts[]` — lista de avisos estratégicos (ver §5)

**Desconto falso (matematicamente correto):**
Para mostrar `d%` OFF mantendo o lucro do `idealPrice`:
`displayedPrice = idealPrice / (1 - d/100)`
`finalPrice = displayedPrice * (1 - d/100) = idealPrice` ✅
As taxas % continuam sendo aplicadas sobre `finalPrice` real, então o lucro líquido é preservado exatamente. Quando `compensateDiscount` está desligado, o desconto corrói o lucro normalmente — e o painel mostra isso de forma clara.

Cobertura por testes manuais com 3 cenários (sem comissão, com comissão alta, com desconto agressivo).

### 3. Layout do cockpit (`PricingSection` em `ProductWorkspace.tsx`)

Layout em grade responsiva (`lg:grid-cols-[280px_minmax(0,1fr)_320px]`):

```text
┌─────────────┬──────────────────────────────────┬───────────────┐
│ CUSTOS      │       RESULTADO MASSIVO          │ ANÁLISE       │
│ (editáveis) │  Preço final · Lucro · Margem    │ "Pra onde vai │
│ +adicionar  │  Preço ideal / mínimo / agressivo│  seu dinheiro"│
│             │                                  │ + alertas     │
├─────────────┴──────────────────────────────────┴───────────────┤
│ SIMULADOR DE CENÁRIOS (10/15/20/25% + custom)                  │
└────────────────────────────────────────────────────────────────┘
```

**Coluna esquerda — Custos (compacta):**
- Lista vertical agrupada por `group` (Produto, Logística, Marketing, Taxas, Outros) com header colapsável
- Cada linha: ícone-handle • label editável inline • input de valor • toggle `R$ ⇄ %` • menu (renomear, nota, mover grupo, remover)
- Botão `+ adicionar custo` no rodapé de cada grupo
- Campo destaque no topo: **"Quanto de lucro você quer ter?"** (R$ ou %) — o coração da operação

**Centro — Resultado massivo:**
- Bloco hero com tipografia gigante (`text-6xl` tabular):
  - **Preço final** (o que o cliente vê / paga)
  - **Lucro líquido** + **Margem real %** lado a lado, coloridos
- Linha secundária menor: Preço ideal • Mínimo seguro • Agressivo • Psicológico
- Linha do desconto: toggle "Mostrar XX% OFF" + slider 0–`maxDiscount` + switch "Compensar no preço de" (desconto falso). Quando ligado, mostra `De ~~R$ X~~ por R$ Y` exatamente como o cliente verá.

**Coluna direita — Análise operacional:**
- Lista "Pra onde vai seu dinheiro" com barras horizontais por item, ordenadas pelo maior consumo, valor em R$ e %
- Bloco "Resumo em linguagem humana" (frases prontas):
  - "Taxas do marketplace consomem 22% da venda."
  - "Você fica com R$ 31,24 (39%) depois de tudo."
  - "Margem para desconto sem prejuízo: até 18%."
- **Alertas estratégicos** (cards coloridos, ver §5)

**Rodapé — Simulador de cenários:**
- Grid de 4–6 cards de cenário (10%, 15%, 20%, 25% OFF + custom)
- Cada card: preço exibido, preço final, lucro, margem, delta vs. ideal, semáforo verde/âmbar/vermelho
- Botão "Aplicar este cenário" preenche `visibleDiscount` instantaneamente

### 4. Inputs e UX

- Tudo reage em tempo real (já é `useMemo`)
- Label editável: click → input inline → blur/Enter salva
- Toggle R$/% num único componente compacto sem labels técnicas
- Sem tabelas, sem aparência de Excel — cards arejados, bordas suaves, tipografia consistente com o resto do app
- Drag-and-drop opcional para reordenar custos (fora desta rodada; só a estrutura `items[]` já permite no futuro)
- Botão `Resetar para o modelo padrão` (recria os custos comuns: Custo do produto, Frete, Embalagem, Ads, Imposto %, Taxa marketplace %, Comissão %)

### 5. Alertas estratégicos (regras)

Engine gera frases automáticas quando:
- `adsValue / finalPrice > 15%` → "Seus anúncios estão consumindo lucro demais."
- `feesValue / finalPrice > 25%` → "Taxas do marketplace acima do saudável."
- `netProfit < 0` → "Você está vendendo no prejuízo."
- `netProfit / finalPrice < 0.10` → "Margem muito apertada para esse desconto."
- `visibleDiscount > maxDiscount` → "Desconto acima do seu limite seguro."
- `shipping / finalPrice > 20%` → "Frete está pesando na competitividade."

Cada alerta é um cartão com cor semântica (`destructive`/`warning`/`success`) e mensagem curta + recomendação.

### 6. Arquivos afetados

- `src/lib/types.ts` — novo `PricingData` + `CostItem` + migração
- `src/lib/pricing.ts` — **novo**: engine pura `computePricing`, `formatBRL`, regras de alerta
- `src/components/ProductWorkspace.tsx` — reescrever `PricingSection` + subcomponentes (`CostList`, `CostRow`, `ResultHero`, `DiscountSimulator`, `MoneyFlowPanel`, `AlertsPanel`, `ScenarioGrid`)
- `src/lib/store.tsx` — helpers: `addCostItem`, `updateCostItem`, `removeCostItem`, `reorderCostItems`
- `src/styles.css` — opcional: tokens `--warning`, `--warning-foreground` se ainda não existirem (sucesso já existe)

### 7. Ordem de execução

1. Tipos + migração (não quebra dados existentes)
2. Engine `pricing.ts` + verificação manual dos cálculos
3. Store helpers para `items[]`
4. Reescrita visual da `PricingSection` (custos → resultado → análise → simulador)
5. Alertas + desconto falso
6. QA visual no preview (1025×583 e largura cheia)

Sem mudanças em outras seções (Keywords, Títulos, Descrição, Vídeos, Imagens) nesta rodada.