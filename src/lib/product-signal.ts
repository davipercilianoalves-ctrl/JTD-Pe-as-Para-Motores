import { computePricing } from "./pricing";
import type { Product } from "./types";

export type ProductStatus = "healthy" | "attention" | "risk" | "incomplete";

export interface ProductSignal {
  status: ProductStatus;
  margin: number;
  finalPrice: number;
  netProfit: number;
  completeness: number; // 0..1
  missing: string[];
}

export function evaluateProduct(p: Product): ProductSignal {
  const pricing = computePricing(p.pricing);
  const missing: string[] = [];
  if (!p.name?.trim()) missing.push("Nome");
  if (!p.sku?.trim()) missing.push("SKU");
  if (!p.images?.length) missing.push("Imagens");
  if (!p.keywords?.length) missing.push("Keywords");
  if (!p.competitors?.length) missing.push("Concorrentes");
  if (!pricing.baseCost) missing.push("Custos");
  const completeness = 1 - missing.length / 6;

  let status: ProductStatus = "healthy";
  if (missing.length >= 3) status = "incomplete";
  else if (pricing.baseCost > 0 && pricing.netProfit < 0) status = "risk";
  else if (pricing.baseCost > 0 && pricing.marginPct < 15) status = "attention";

  return {
    status,
    margin: pricing.marginPct,
    finalPrice: pricing.finalPrice,
    netProfit: pricing.netProfit,
    completeness,
    missing,
  };
}

export const STATUS_META: Record<
  ProductStatus,
  { label: string; dot: string; ring: string; text: string }
> = {
  healthy: {
    label: "Saudável",
    dot: "bg-success",
    ring: "ring-success/30",
    text: "text-success",
  },
  attention: {
    label: "Atenção",
    dot: "bg-warning",
    ring: "ring-warning/40",
    text: "text-warning",
  },
  risk: {
    label: "Risco",
    dot: "bg-primary",
    ring: "ring-primary/40",
    text: "text-primary",
  },
  incomplete: {
    label: "Incompleto",
    dot: "bg-muted-foreground",
    ring: "ring-border",
    text: "text-muted-foreground",
  },
};
