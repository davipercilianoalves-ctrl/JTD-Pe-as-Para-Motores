import type { CostItem, PricingData } from "./types";

export const brl = (v: number) =>
  (isFinite(v) ? v : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const psychPrice = (v: number) => {
  if (v <= 0) return 0;
  const base = Math.floor(v);
  return base + (v < 100 ? 0.9 : 0.99);
};

export interface BreakdownLine {
  item: CostItem;
  amount: number;       // R$ consumido na venda final
  pctOfFinal: number;   // % do preço final
}

export interface Alert {
  id: string;
  tone: "info" | "warning" | "danger" | "success";
  title: string;
  detail?: string;
}

export interface PricingResult {
  baseCost: number;       // somatório de custos fixos (R$ + percent base "cost" sobre custos)
  feesPct: number;        // somatório de percent base "final" (0..1, ex 0.22)
  idealPrice: number;     // preço alvo que garante o lucro desejado
  displayedPrice: number; // preço "de" (riscado) — quando compensateDiscount, sobe acima do ideal
  finalPrice: number;     // preço final cobrado depois do desconto visível
  minSafePrice: number;   // preço onde o lucro líquido = 0
  aggressivePrice: number; // com maxDiscount aplicado
  psychological: number;  // psicológico (.90/.99)
  netProfit: number;      // lucro líquido em R$
  marginPct: number;      // margem real % sobre o preço final
  desiredProfitValue: number; // alvo de lucro convertido em R$ sobre o ideal
  breakdown: BreakdownLine[];
  alerts: Alert[];
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

export function computePricing(p: PricingData): PricingResult {
  const breakdown: BreakdownLine[] = [];
  const alerts: Alert[] = [];

  // Helper to ensure we have numbers
  const num = (v: any) => Number(v) || 0;

  // CUSTOS
  const productCost = num(p.productCost);
  
  const getVal = (val: number, type: "R$" | "%", base: number) => {
    return type === "R$" ? val : (val / 100) * base;
  };

  const marketplaceFeeR = getVal(num(p.marketplaceFee), p.marketplaceFeeType, p.salePrice);
  const shippingR = getVal(num(p.shipping), p.shippingType, p.salePrice);
  const packagingR = getVal(num(p.packaging), p.packagingType, p.salePrice);
  const transportR = getVal(num(p.transport), p.transportType, p.salePrice);
  const taxR = getVal(num(p.tax), p.taxType, p.salePrice);

  const totalCosts = productCost + marketplaceFeeR + shippingR + packagingR + transportR + taxR;
  const netProfit = num(p.salePrice) - totalCosts;
  const marginPct = num(p.salePrice) > 0 ? (netProfit / p.salePrice) * 100 : 0;

  // This is a simplified version to fix build errors while we implement the full UI
  return {
    baseCost: totalCosts,
    feesPct: 0,
    idealPrice: p.salePrice,
    displayedPrice: p.salePrice,
    finalPrice: p.salePrice,
    minSafePrice: totalCosts,
    aggressivePrice: p.salePrice,
    psychological: psychPrice(p.salePrice),
    netProfit,
    marginPct,
    desiredProfitValue: p.desiredProfit,
    breakdown,
    alerts,
  };
}

export function simulateScenario(p: PricingData, discountPct: number): PricingResult {
  return computePricing(p); // Placeholder
}

export type PriceStatus = "healthy" | "attention" | "risk" | "loss";

export interface PriceAnalysis {
  price: number;
  netProfit: number;
  marginPct: number;
  status: PriceStatus;
  reason: string;
}

/** Evaluate any arbitrary price against the current cost structure. */
export function analyzePrice(
  p: PricingData,
  price: number,
  kind: "ideal" | "min" | "psych" | "aggressive",
): PriceAnalysis {
  return { price, netProfit: 0, marginPct: 0, status: "healthy", reason: "" }; // Placeholder
}


export const GROUP_LABELS: Record<string, string> = {
  produto: "Produto",
  logistica: "Logística",
  marketing: "Marketing",
  taxas: "Taxas & comissões",
  outros: "Outros",
};

export const GROUP_ORDER: Array<keyof typeof GROUP_LABELS> = [
  "produto",
  "logistica",
  "marketing",
  "taxas",
  "outros",
];
