export type TitleVariant = "SEO Forte" | "Conversão" | "Mobile" | "Curto" | "Completo";

export interface Keyword {
  id: string;
  text: string; // canonical lowercased
  display: string; // original case (first occurrence)
  favorite: boolean;
  uses: number;
}

export interface CompetitorBlock {
  id: string;
  link: string;
  title: string;
  description: string;
  notes: string;
  keywordsFound: string[];
  /** @deprecated kept for backwards-compat migration only */
  strongWords?: string;
  marketplace: string;
  updatedAt: number;
}

export interface TitleEntry {
  id: string;
  variant: TitleVariant;
  text: string;
}

export interface MarketplaceData {
  titles: TitleEntry[];
  shortDescription: string;
  description: string;
  seo: string;
  notes: string;
  media: string;
  strategies: string;
  extras: Record<string, string>;
}

export interface PricingData {
  cost: number;
  shipping: number;
  packaging: number;
  transportation: number;
  ads: number;
  taxes: number;
  marketplaceFee: number;
  commission: number;
  markup: number;
  discount: number;
  maxDiscount: number;
}

export interface ProductImage {
  id: string;
  dataUrl: string;
  name: string;
  favorite: boolean;
  isMain?: boolean;
  notes: string;
}

export interface ProductVideo {
  id: string;
  link: string;
  videoDataUrl?: string;
  videoName?: string;
  audioDataUrl?: string;
  audioName?: string;
  script: string;
  speech: string;
  audio: string;
  description: string;
  cta: string;
  platform: string;
  editingNotes: string;
  notes: string;
}

export interface ViralClip {
  id: string;
  link: string;
  platform: string;
  views: string;
  hook: string;
  strategy: string;
  structure: string;
  audio: string;
  notes: string;
  editType: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  originalCode: string;
  brand: string;
  category: string;
  supplier: string;
  internalNotes: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;

  keywords: Keyword[];
  /** @deprecated kept for migration only */
  keywordsText?: string;
  competitors: CompetitorBlock[];

  mercadoLivre: MarketplaceData;
  shopee: MarketplaceData;
  amazon: MarketplaceData;
  tiktok: MarketplaceData;

  pricing: PricingData;
  images: ProductImage[];
  videos: ProductVideo[];
}

export const emptyMarketplace = (): MarketplaceData => ({
  titles: [],
  description: "",
  seo: "",
  notes: "",
  media: "",
  strategies: "",
  extras: {},
});

export const emptyPricing = (): PricingData => ({
  cost: 0,
  shipping: 0,
  packaging: 0,
  transportation: 0,
  ads: 0,
  taxes: 0,
  marketplaceFee: 0,
  commission: 0,
  markup: 50,
  discount: 0,
  maxDiscount: 15,
});

export const newProduct = (name = "Novo produto"): Product => ({
  id: crypto.randomUUID(),
  name,
  sku: "",
  originalCode: "",
  brand: "",
  category: "",
  supplier: "",
  internalNotes: "",
  favorite: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  keywords: [],
  competitors: [],
  mercadoLivre: emptyMarketplace(),
  shopee: emptyMarketplace(),
  amazon: emptyMarketplace(),
  tiktok: emptyMarketplace(),
  pricing: emptyPricing(),
  images: [],
  videos: [],
});

/** Canonicalize a raw token to its lowercase trimmed form. */
export const canonKeyword = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ");

/** Parse a freeform string (spaces, commas, newlines) into tokens. */
export const parseKeywordTokens = (raw: string): string[] =>
  raw
    .split(/[\n,]+|\s{2,}/) // newlines / commas / double spaces split phrases
    .map((s) => s.trim())
    .filter(Boolean);

/** Looser tokenizer: splits on single spaces too. Used for the manual single-word flow. */
export const parseSingleWords = (raw: string): string[] =>
  raw
    .split(/[\s,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Migrate any legacy Product shape to the current one. Safe to call on existing products. */
export function migrateProduct(raw: any): Product {
  const base = newProduct(raw?.name ?? "Sem nome");
  const p: Product = {
    ...base,
    ...raw,
    pricing: { ...base.pricing, ...(raw?.pricing ?? {}) },
    mercadoLivre: { ...base.mercadoLivre, ...(raw?.mercadoLivre ?? {}) },
    shopee: { ...base.shopee, ...(raw?.shopee ?? {}) },
    amazon: { ...base.amazon, ...(raw?.amazon ?? {}) },
    tiktok: { ...base.tiktok, ...(raw?.tiktok ?? {}) },
    images: (raw?.images ?? []).map((i: any) => ({ ...i, isMain: i.isMain ?? false })),
    videos: (raw?.videos ?? []).map((v: any) => ({
      speech: "",
      notes: "",
      ...v,
    })),
    competitors: (raw?.competitors ?? []).map((c: any) => ({
      ...c,
      keywordsFound: Array.isArray(c.keywordsFound)
        ? c.keywordsFound
        : c.strongWords
          ? parseKeywordTokens(c.strongWords)
          : [],
    })),
    keywords: Array.isArray(raw?.keywords) ? raw.keywords : [],
  };
  // legacy keywordsText → keywords[]
  if ((!p.keywords || p.keywords.length === 0) && typeof raw?.keywordsText === "string") {
    const tokens = parseKeywordTokens(raw.keywordsText);
    const map = new Map<string, Keyword>();
    for (const t of tokens) {
      const key = canonKeyword(t);
      if (!key) continue;
      const ex = map.get(key);
      if (ex) ex.uses += 1;
      else
        map.set(key, {
          id: crypto.randomUUID(),
          text: key,
          display: t.trim(),
          favorite: false,
          uses: 1,
        });
    }
    p.keywords = Array.from(map.values());
  }
  return p;
}
