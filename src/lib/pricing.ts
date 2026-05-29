import type { PricingData } from "./types";

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
  amount: number;
  pctOfFinal: number;
  item: any; // Compatibility field
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
  scenarios: number[];
  maxDiscount: number;
}

export function computePricing(p: PricingData): PricingResult {
  const num = (v: any) => Number(v) || 0;
  const productCost = num(p.productCost);
  
  // Correction 3: Safe margin for Mode 3 calculation
  const safeMargin = Math.min(99, Math.max(0, num(p.desiredMargin)));
  
  let salePrice = num(p.salePrice);
  
  // Basic total cost calculation (fixed costs)
  // We need to handle relative costs (percentages) carefully.
  // In many marketplace formulas, fees are on the SALE PRICE.
  
  const marketplaceFeeVal = num(p.marketplaceFee);
  const marketplaceFeePct = p.marketplaceFeeType === "%" ? marketplaceFeeVal / 100 : 0;
  const marketplaceFeeFix = p.marketplaceFeeType === "R$" ? marketplaceFeeVal : 0;
  
  const shippingVal = num(p.shipping);
  const shippingPct = p.shippingType === "%" ? shippingVal / 100 : 0;
  const shippingFix = p.shippingType === "R$" ? shippingVal : 0;
  
  const packagingVal = num(p.packaging);
  const packagingPct = p.packagingType === "%" ? packagingVal / 100 : 0;
  const packagingFix = p.packagingType === "R$" ? packagingVal : 0;
  
  const transportVal = num(p.transport);
  const transportPct = p.transportType === "%" ? transportVal / 100 : 0;
  const transportFix = p.transportType === "R$" ? transportVal : 0;
  
  const taxVal = num(p.tax);
  const taxPct = p.taxType === "%" ? taxVal / 100 : 0;
  const taxFix = p.taxType === "R$" ? taxVal : 0;

  const totalFixedCosts = productCost + marketplaceFeeFix + shippingFix + packagingFix + transportFix + taxFix;
  const totalVariablePct = marketplaceFeePct + shippingPct + packagingPct + transportPct + taxPct;

  // Calculation Mode Logic
  if (p.calcMode === "margin") {
    // Correction 2 & 3: real margin over sale price
    // SalePrice = TotalFixedCosts / (1 - Variable% - DesiredMargin%)
    const denominator = 1 - totalVariablePct - (safeMargin / 100);
    salePrice = denominator > 0 ? totalFixedCosts / denominator : totalFixedCosts / 0.01;
  } else if (p.calcMode === "profit") {
    // SalePrice = (TotalFixedCosts + DesiredProfit) / (1 - Variable%)
    const desiredProfit = num(p.desiredProfit);
    const denominator = 1 - totalVariablePct;
    salePrice = denominator > 0 ? (totalFixedCosts + desiredProfit) / denominator : totalFixedCosts + desiredProfit;
  }
  
  const getVal = (val: number, type: "R$" | "%", base: number) => {
    return type === "R$" ? val : (val / 100) * base;
  };

  const mFeeR = getVal(marketplaceFeeVal, p.marketplaceFeeType, salePrice);
  const shipR = getVal(shippingVal, p.shippingType, salePrice);
  const packR = getVal(packagingVal, p.packagingType, salePrice);
  const transR = getVal(transportVal, p.transportType, salePrice);
  const taxR = getVal(taxVal, p.taxType, salePrice);

  const totalCosts = productCost + mFeeR + shipR + packR + transR + taxR;
  const netProfit = salePrice - totalCosts;
  const marginPct = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;

  const breakdown: BreakdownLine[] = [
    { label: "Custo do produto", amount: productCost, pctOfFinal: salePrice > 0 ? (productCost / salePrice) * 100 : 0 },
    { label: "Taxa marketplace", amount: mFeeR, pctOfFinal: salePrice > 0 ? (mFeeR / salePrice) * 100 : 0 },
    { label: "Frete", amount: shipR, pctOfFinal: salePrice > 0 ? (shipR / salePrice) * 100 : 0 },
    { label: "Embalagem", amount: packR, pctOfFinal: salePrice > 0 ? (packR / salePrice) * 100 : 0 },
    { label: "Transporte", amount: transR, pctOfFinal: salePrice > 0 ? (transR / salePrice) * 100 : 0 },
    { label: "Imposto", amount: taxR, pctOfFinal: salePrice > 0 ? (taxR / salePrice) * 100 : 0 },
  ].map(b => ({ ...b, item: { id: b.label, label: b.label, value: b.amount, kind: "currency", group: "outros" } }));

  const alerts: Alert[] = [];
  if (salePrice > 0 && netProfit < 0) {
    alerts.push({
      id: "loss",
      tone: "danger",
      title: "Prejuízo detectado",
      detail: `Você está perdendo ${brl(-netProfit)} por venda.`,
    });
  }

  const fakeDiscountPct = num(p.fakeDiscountPercent);
  const priceWithMarkup = fakeDiscountPct > 0 && fakeDiscountPct < 100
    ? salePrice / (1 - fakeDiscountPct / 100)
    : salePrice;

  return {
    baseCost: totalCosts,
    feesPct: salePrice > 0 ? ((mFeeR + taxR) / salePrice) : 0,
    idealPrice: salePrice,
    displayedPrice: priceWithMarkup,
    finalPrice: salePrice,
    minSafePrice: totalCosts,
    aggressivePrice: salePrice,
    psychological: psychPrice(salePrice),
    netProfit,
    marginPct,
    desiredProfitValue: netProfit,
    breakdown,
    alerts,
    scenarios: [10, 20, 30, 40],
    maxDiscount: 50
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
  kind: string,
): PriceAnalysis {
  const res = computePricing({ ...p, salePrice: price, calcMode: "price" });
  let status: PriceStatus = "healthy";
  if (res.netProfit < 0) status = "loss";
  else if (res.marginPct < 10) status = "risk";
  else if (res.marginPct < 20) status = "attention";

  return { price, netProfit: res.netProfit, marginPct: res.marginPct, status, reason: kind };
}

export const GROUP_LABELS: Record<string, string> = {
  produto: "Produto",
  logistica: "Logística",
  marketing: "Marketing",
  taxas: "Taxas & comissões",
  outros: "Outros",
};

export const GROUP_ORDER = ["produto", "logistica", "marketing", "taxas", "outros"];
