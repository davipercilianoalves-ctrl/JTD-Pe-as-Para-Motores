export type TitleVariant = "SEO Forte" | "Conversão" | "Mobile" | "Curto" | "Completo";

export type MarketplaceId = "mercadoLivre" | "shopee" | "amazon" | "tiktok";

export const MARKETPLACE_LABELS: Record<MarketplaceId, string> = {
  mercadoLivre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  tiktok: "TikTok",
};

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
  price?: number; // Added for competitive analysis
}

export interface MarketplaceData {
  titles: string[];
  titleLimit?: number;
  aiTemplate?: string;
  shortDescription: string;
  description: string;
  seo: string;
  notes: string;
  media: string;
  strategies: string;
  extras: Record<string, string>;
  /** Optional user-defined fields scoped to this marketplace. */
  customFields?: CustomField[];
  pricing?: PricingData;
}

// ─── Custom Field Engine ──────────────────────────────────────────────────
export type CustomFieldKind =
  | "short"      // single line
  | "long"      // multi-line auto-expand
  | "rich"       // multi-line w/ markdown-ish (plain text for now, larger)
  | "number"
  | "currency"
  | "percent"
  | "tags"       // chips
  | "url"
  | "checkbox"
  | "select"
  | "bullets"    // one-per-line bullet list
  | "spec"       // key:value pairs
  | "notes";     // sticky-style note

export type CustomFieldWidth = 25 | 50 | 75 | 100;

export interface CustomField {
  id: string;
  kind: CustomFieldKind;
  label: string;
  placeholder?: string;
  width: CustomFieldWidth;
  required?: boolean;
  options?: string[];           // for select
  value: unknown;                // string | number | boolean | string[] | {k,v}[]
  note?: string;
  /** Which marketplaces this field applies to. Empty / undefined = global (visible in every mode). */
  marketplaces?: MarketplaceId[];
}

export type CostKind = "currency" | "percent";
export type PercentBase = "final" | "cost";
export type CostGroup = "produto" | "logistica" | "marketing" | "taxas" | "outros";

export interface CostItem {
  id: string;
  label: string;
  kind: CostKind;
  value: number;
  base?: PercentBase;
  group: CostGroup;
  note?: string;
}

export interface PricingData {
  productCost: number;
  marketplaceFee: number;
  marketplaceFeeType: "R$" | "%";
  shipping: number;
  shippingType: "R$" | "%";
  packaging: number;
  packagingType: "R$" | "%";
  transport: number;
  transportType: "R$" | "%";
  tax: number;
  taxType: "R$" | "%";
  calcMode: "price" | "profit" | "margin";
  salePrice: number;
  desiredProfit: number;
  desiredMargin: number;
  fakeDiscountPercent: number;
  // Temporary compatibility fields to fix build errors in ProductWorkspace.tsx
  items: CostItem[];
  visibleDiscount: number;
  compensateDiscount: boolean;
  maxDiscount: number;
  scenarios: number[];
  desiredProfitKind: CostKind;
}

export interface ProductImage {
  id: string;
  dataUrl: string;
  order: number;
  isCover: boolean;
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
  niche_faqs?: string; // Added for FAQs section

  mercadoLivre: MarketplaceData;
  shopee: MarketplaceData;
  amazon: MarketplaceData;
  tiktok: MarketplaceData;

  pricing?: PricingData; // Kept for global/legacy if needed, but marketplace-specific preferred
  images: ProductImage[];
  videos: ProductVideo[];

  /** User-defined fields global to the product (independent of marketplace). */
  customFields: CustomField[];
}

export const emptyMarketplace = (): MarketplaceData => ({
  titles: [""],
  shortDescription: "",
  description: "",
  seo: "",
  notes: "",
  media: "",
  strategies: "",
  extras: {},
  customFields: [],
});

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const emptyPricing = (): PricingData => ({
  productCost: 0,
  marketplaceFee: 0,
  marketplaceFeeType: "%",
  shipping: 0,
  shippingType: "R$",
  packaging: 0,
  packagingType: "R$",
  transport: 0,
  transportType: "R$",
  tax: 0,
  taxType: "%",
  calcMode: "price",
  salePrice: 0,
  desiredProfit: 0,
  desiredMargin: 0,
  fakeDiscountPercent: 0,
  items: [],
  visibleDiscount: 0,
  compensateDiscount: false,
  maxDiscount: 50,
  scenarios: [10, 20, 30, 40],
  desiredProfitKind: "percent",
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
  customFields: [],
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

export function migratePricing(raw: any): PricingData {
  const base = emptyPricing();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
  };
}

/** Migrate any legacy Product shape to the current one. Safe to call on existing products. */
export function migrateProduct(raw: any): Product {
  const base = newProduct(raw?.name ?? "Sem nome");
  const ensureMK = (mk: any): MarketplaceData => {
    const data = {
      ...base.mercadoLivre,
      ...(mk ?? {}),
      customFields: Array.isArray(mk?.customFields) ? mk.customFields : [],
    };
    if (Array.isArray(data.titles) && data.titles.length > 0 && typeof data.titles[0] === "object") {
      data.titles = (data.titles as any).map((t: any) => t.text || "");
    }
    if (!Array.isArray(data.titles)) {
      data.titles = [""];
    }
    return data;
  };
  const p: Product = {
    ...base,
    ...raw,
    pricing: migratePricing(raw?.pricing),
    mercadoLivre: ensureMK(raw?.mercadoLivre),
    shopee: ensureMK(raw?.shopee),
    amazon: ensureMK(raw?.amazon),
    tiktok: ensureMK(raw?.tiktok),
    images: (raw?.images ?? []).map((i: any, index: number) => ({
      id: i.id || crypto.randomUUID(),
      dataUrl: i.dataUrl || "",
      order: i.order ?? index,
      isCover: i.isCover ?? i.isMain ?? (index === 0),
    })),
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
    customFields: Array.isArray(raw?.customFields) ? raw.customFields : [],
  };

  const mkKeys: MarketplaceId[] = ["mercadoLivre", "shopee", "amazon", "tiktok"];
  for (const mk of mkKeys) {
    const block = p[mk] as MarketplaceData;
    const legacy = block?.customFields;
    if (Array.isArray(legacy) && legacy.length) {
      const tagged: CustomField[] = legacy.map((f) => ({
        ...f,
        marketplaces: Array.from(new Set([...(f.marketplaces ?? []), mk])),
      }));
      p.customFields = [...p.customFields, ...tagged];
      p[mk] = { ...block, customFields: [] };
    }
  }

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