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