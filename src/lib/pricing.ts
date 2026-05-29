import type { PricingData, MarketplaceId } from "./types";

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
  label: string;
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
  baseCost: number;
  feesPct: number;
  idealPrice: number;
  displayedPrice: number;
  finalPrice: number;
  minSafePrice: number;
  aggressivePrice: number;
  psychological: number;
  netProfit: number;
  marginPct: number;
  desiredProfitValue: number;
  breakdown: BreakdownLine[];
  alerts: Alert[];
}

export function computePricing(p: PricingData): PricingResult {
  const num = (v: any) => Number(v) || 0;
  
  const productCost = num(p.productCost);
  const salePrice = num(p.salePrice);
  
  const getVal = (val: number, type: "R$" | "%", base: number) => {
    return type === "R$" ? val : (val / 100) * base;
  };

  const marketplaceFeeR = getVal(num(p.marketplaceFee), p.marketplaceFeeType, salePrice);
  const shippingR = getVal(num(p.shipping), p.shippingType, salePrice);
  const packagingR = getVal(num(p.packaging), p.packagingType, salePrice);
  const transportR = getVal(num(p.transport), p.transportType, salePrice);
  const taxR = getVal(num(p.tax), p.taxType, salePrice);

  const totalCosts = productCost + marketplaceFeeR + shippingR + packagingR + transportR + taxR;
  const netProfit = salePrice - totalCosts;
  const marginPct = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;

  const breakdown: BreakdownLine[] = [
    { label: "Custo do produto", amount: productCost, pctOfFinal: salePrice > 0 ? (productCost / salePrice) * 100 : 0 },
    { label: "Taxa marketplace", amount: marketplaceFeeR, pctOfFinal: salePrice > 0 ? (marketplaceFeeR / salePrice) * 100 : 0 },
    { label: "Frete", amount: shippingR, pctOfFinal: salePrice > 0 ? (shippingR / salePrice) * 100 : 0 },
    { label: "Embalagem", amount: packagingR, pctOfFinal: salePrice > 0 ? (packagingR / salePrice) * 100 : 0 },
    { label: "Transporte", amount: transportR, pctOfFinal: salePrice > 0 ? (transportR / salePrice) * 100 : 0 },
    { label: "Imposto", amount: taxR, pctOfFinal: salePrice > 0 ? (taxR / salePrice) * 100 : 0 },
  ];

  const alerts: Alert[] = [];
  if (salePrice > 0 && netProfit < 0) {
    alerts.push({
      id: "loss",
      tone: "danger",
      title: "Prejuízo detectado",
      detail: `Você está perdendo ${brl(-netProfit)} por venda.`,
    });
  }

  return {
    baseCost: totalCosts,
    feesPct: salePrice > 0 ? ((marketplaceFeeR + taxR) / salePrice) : 0,
    idealPrice: salePrice,
    displayedPrice: salePrice / (1 - (num(p.fakeDiscountPercent) / 100) || 1),
    finalPrice: salePrice,
    minSafePrice: totalCosts,
    aggressivePrice: salePrice,
    psychological: psychPrice(salePrice),
    netProfit,
    marginPct,
    desiredProfitValue: netProfit,
    breakdown,
    alerts,
  };
}

export function simulateScenario(p: PricingData, discountPct: number): PricingResult {
  return computePricing(p);
}

export type PriceStatus = "healthy" | "attention" | "risk" | "loss";

export interface PriceAnalysis {
  price: number;
  netProfit: number;
  marginPct: number;
  status: PriceStatus;
  reason: string;
}

export function analyzePrice(
  p: PricingData,
  price: number,
  kind: "ideal" | "min" | "psych" | "aggressive",
): PriceAnalysis {
  const res = computePricing({ ...p, salePrice: price });
  let status: PriceStatus = "healthy";
  if (res.netProfit < 0) status = "loss";
  else if (res.marginPct < 10) status = "risk";
  else if (res.marginPct < 20) status = "attention";

  return { 
    price, 
    netProfit: res.netProfit, 
    marginPct: res.marginPct, 
    status, 
    reason: kind 
  };
}

export const GROUP_LABELS: Record<string, string> = {
  produto: "Produto",
  logistica: "Logística",
  marketing: "Marketing",
  taxas: "Taxas & comissões",
  outros: "Outros",
};

export const GROUP_ORDER = [
  "produto",
  "logistica",
  "marketing",
  "taxas",
  "outros",
];
