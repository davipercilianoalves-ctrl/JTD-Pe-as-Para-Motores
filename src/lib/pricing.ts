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
  // 1) base cost = todos R$ + percent com base "cost"
  let baseCost = 0;
  let feesPct = 0;
  for (const it of p.items) {
    if (it.kind === "currency") baseCost += Number(it.value) || 0;
    else if (it.base === "cost") baseCost += baseCost * ((Number(it.value) || 0) / 100);
    else feesPct += (Number(it.value) || 0) / 100;
  }
  feesPct = clamp(feesPct, 0, 0.95);

  // 2) lucro alvo (sobre o preço final ideal). Resolve algebricamente:
  //    ideal = baseCost + lucro + ideal * feesPct + (lucro se % do ideal)
  // Caso percent: ideal*(1 - feesPct - desired/100) = baseCost
  // Caso currency: ideal*(1 - feesPct) = baseCost + desired
  let idealPrice = 0;
  let desiredProfitValue = 0;
  if (p.desiredProfitKind === "percent") {
    const d = clamp((Number(p.desiredProfit) || 0) / 100, 0, 0.95);
    const denom = 1 - feesPct - d;
    idealPrice = denom > 0 ? baseCost / denom : baseCost / Math.max(1 - feesPct, 0.01);
    desiredProfitValue = idealPrice * d;
  } else {
    const lucro = Number(p.desiredProfit) || 0;
    idealPrice = (baseCost + lucro) / Math.max(1 - feesPct, 0.01);
    desiredProfitValue = lucro;
  }

  // 3) desconto visível e compensação
  const d = clamp((Number(p.visibleDiscount) || 0) / 100, 0, 0.95);
  let displayedPrice = idealPrice;
  let finalPrice = idealPrice;
  if (d > 0) {
    if (p.compensateDiscount) {
      // sobe o "de" para que o "por" continue exatamente igual ao ideal
      displayedPrice = idealPrice / (1 - d);
      finalPrice = displayedPrice * (1 - d); // == idealPrice
    } else {
      displayedPrice = idealPrice;
      finalPrice = idealPrice * (1 - d);
    }
  }

  // 4) lucro real sobre finalPrice
  const feesValueFinal = finalPrice * feesPct;
  const netProfit = finalPrice - baseCost - feesValueFinal;
  const marginPct = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;

  // 5) preço mínimo seguro (lucro = 0)
  const minSafePrice = baseCost / Math.max(1 - feesPct, 0.01);

  // 6) preço agressivo (max discount aplicado sobre o ideal — sem compensar)
  const md = clamp((Number(p.maxDiscount) || 0) / 100, 0, 0.95);
  const aggressivePrice = idealPrice * (1 - md);

  // 7) breakdown por item sobre o finalPrice
  const breakdown: BreakdownLine[] = p.items.map((it) => {
    let amount = 0;
    if (it.kind === "currency") amount = Number(it.value) || 0;
    else if (it.base === "cost") amount = baseCost * ((Number(it.value) || 0) / 100);
    else amount = finalPrice * ((Number(it.value) || 0) / 100);
    return {
      item: it,
      amount,
      pctOfFinal: finalPrice > 0 ? (amount / finalPrice) * 100 : 0,
    };
  });

  // 8) alertas
  const alerts: Alert[] = [];
  if (baseCost > 0 && netProfit < 0) {
    alerts.push({
      id: "loss",
      tone: "danger",
      title: "Você está vendendo no prejuízo.",
      detail: `Falta ${brl(-netProfit)} para empatar.`,
    });
  } else if (finalPrice > 0 && netProfit / finalPrice < 0.1 && baseCost > 0) {
    alerts.push({
      id: "thin",
      tone: "warning",
      title: "Margem muito apertada.",
      detail: "Menos de 10% sobra depois de todos os custos.",
    });
  }
  const adsLine = breakdown.find((b) => /ads|an[uú]ncio/i.test(b.item.label));
  if (adsLine && adsLine.pctOfFinal > 15) {
    alerts.push({
      id: "ads",
      tone: "warning",
      title: "Seus anúncios estão consumindo lucro demais.",
      detail: `Ads = ${adsLine.pctOfFinal.toFixed(1)}% da venda.`,
    });
  }
  const feesValue = feesValueFinal;
  if (finalPrice > 0 && feesValue / finalPrice > 0.25) {
    alerts.push({
      id: "fees",
      tone: "warning",
      title: "Taxas do marketplace acima do saudável.",
      detail: `Total de taxas % consome ${(feesPct * 100).toFixed(1)}% da venda.`,
    });
  }
  const shipLine = breakdown.find((b) => /frete/i.test(b.item.label));
  if (shipLine && shipLine.pctOfFinal > 20) {
    alerts.push({
      id: "ship",
      tone: "warning",
      title: "Frete está pesando na competitividade.",
      detail: `Frete = ${shipLine.pctOfFinal.toFixed(1)}% do preço final.`,
    });
  }
  if ((Number(p.visibleDiscount) || 0) > (Number(p.maxDiscount) || 0)) {
    alerts.push({
      id: "maxd",
      tone: "danger",
      title: "Desconto acima do seu limite seguro.",
      detail: `Limite ${p.maxDiscount}%, aplicado ${p.visibleDiscount}%.`,
    });
  }
  if (baseCost > 0 && netProfit > 0 && marginPct >= 25 && alerts.length === 0) {
    alerts.push({
      id: "ok",
      tone: "success",
      title: "Operação saudável.",
      detail: `Margem real ${marginPct.toFixed(1)}%.`,
    });
  }

  return {
    baseCost,
    feesPct,
    idealPrice,
    displayedPrice,
    finalPrice,
    minSafePrice,
    aggressivePrice,
    psychological: psychPrice(displayedPrice || idealPrice),
    netProfit,
    marginPct,
    desiredProfitValue,
    breakdown,
    alerts,
  };
}

export function simulateScenario(p: PricingData, discountPct: number): PricingResult {
  return computePricing({ ...p, visibleDiscount: discountPct });
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
  // base cost recompute (same as computePricing first pass)
  let baseCost = 0;
  let feesPct = 0;
  for (const it of p.items) {
    if (it.kind === "currency") baseCost += Number(it.value) || 0;
    else if (it.base === "cost") baseCost += baseCost * ((Number(it.value) || 0) / 100);
    else feesPct += (Number(it.value) || 0) / 100;
  }
  feesPct = Math.min(Math.max(feesPct, 0), 0.95);
  const fees = price * feesPct;
  const netProfit = price - baseCost - fees;
  const marginPct = price > 0 ? (netProfit / price) * 100 : 0;

  let status: PriceStatus = "healthy";
  if (netProfit < 0) status = "loss";
  else if (marginPct < 5) status = "risk";
  else if (marginPct < 15) status = "attention";

  const profitTxt = `${brl(netProfit)} (${marginPct.toFixed(1)}%)`;
  let reason = "";
  switch (kind) {
    case "ideal":
      reason =
        netProfit > 0
          ? `Preço alvo. Entrega ${profitTxt} de lucro líquido sem desconto.`
          : `Preço alvo definido, mas seus custos consomem tudo. Revise.`;
      break;
    case "min":
      reason =
        marginPct <= 1
          ? "Empate. Aqui você não ganha nem perde — use só para queima de estoque."
          : `Limite absoluto. Abaixo disso é prejuízo. Sobra apenas ${profitTxt}.`;
      break;
    case "psych":
      reason =
        netProfit > 0
          ? `Termina em .99/.90 — converte mais. Lucro real: ${profitTxt}.`
          : `Psicológico abaixo do custo. Não use.`;
      break;
    case "aggressive":
      reason =
        netProfit > 0
          ? `Limite agressivo (${p.maxDiscount}% OFF). Ainda lucra ${profitTxt}.`
          : `Desconto agressivo derruba o lucro. Não recomendado.`;
      break;
  }

  return { price, netProfit, marginPct, status, reason };
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
