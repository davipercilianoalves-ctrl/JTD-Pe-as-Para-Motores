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
  finalPrice: number;
  margin: number;
  completeness: number;
}

export const STATUS_META: Record<ProductStatus, { label: string; color: string; dot: string; ring: string; text: string }> = {
  incomplete: { label: "Incompleto", color: "text-muted-foreground bg-muted", dot: "bg-muted-foreground", ring: "border-muted", text: "text-muted-foreground" },
  healthy: { label: "Saudável", color: "text-success bg-success/10", dot: "bg-success", ring: "border-success/40", text: "text-success" },
  danger: { label: "Crítico", color: "text-destructive bg-destructive/10", dot: "bg-destructive", ring: "border-destructive/40", text: "text-destructive" },
  warning: { label: "Atenção", color: "text-warning bg-warning/10", dot: "bg-warning", ring: "border-warning/40", text: "text-warning" },
};

export function evaluateProduct(p: Product): ProductSignal {
  const pricing = p.pricing || emptyPricing();
  const completeness = Math.min(100, (p.keywords.length * 10) + (p.competitors.length * 20));
  
  return { 
    status: completeness < 50 ? "incomplete" : "healthy", 
    score: completeness, 
    label: completeness < 50 ? "Incompleto" : "Saudável",
    finalPrice: pricing.salePrice || 0,
    margin: pricing.desiredMargin || 0,
    completeness
  };
}
