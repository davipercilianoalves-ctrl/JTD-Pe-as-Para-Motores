import { type Product, emptyPricing } from "./types";

/**
 * Extract just the core "signal" fields from a product to determine
 * its competitive stance and pricing health.
 */
export function getProductSignal(p: Product) {
  return {
    id: p.id,
    name: p.name,
    pricing: p.pricing || emptyPricing(),
    keywordsCount: p.keywords.length,
    competitorsCount: p.competitors.length,
    imagesCount: p.images.length,
    updatedAt: p.updatedAt,
  };
}

export type ProductStatus = "incomplete" | "healthy" | "danger" | "warning";

export interface ProductSignal {
  status: ProductStatus;
  score: number;
  label: string;
}

export const STATUS_META: Record<ProductStatus, { label: string; color: string }> = {
  incomplete: { label: "Incompleto", color: "text-muted-foreground bg-muted" },
  healthy: { label: "Saudável", color: "text-success bg-success/10" },
  danger: { label: "Crítico", color: "text-destructive bg-destructive/10" },
  warning: { label: "Atenção", color: "text-warning bg-warning/10" },
};

export function evaluateProduct(p: Product): ProductSignal {
  // Simplified logic for compatibility
  const signals = getProductSignal(p);
  if (signals.competitorsCount === 0 || signals.keywordsCount < 3) {
    return { status: "incomplete", score: 30, label: "Incompleto" };
  }
  return { status: "healthy", score: 100, label: "Saudável" };
}
