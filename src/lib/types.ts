export type TitleVariant = "SEO Forte" | "Conversão" | "Mobile" | "Curto" | "Completo";

export interface Keyword {
  id: string;
  text: string;
  favorite: boolean;
  uses: number;
}

export interface CompetitorBlock {
  id: string;
  link: string;
  title: string;
  description: string;
  notes: string;
  strongWords: string;
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
  ads: number;
  taxes: number; // %
  marketplaceFee: number; // %
  commission: number; // %
  markup: number; // %
  discount: number; // %
  maxDiscount: number; // %
}

export interface ProductImage {
  id: string;
  dataUrl: string;
  name: string;
  favorite: boolean;
  notes: string;
}

export interface ProductVideo {
  id: string;
  link: string;
  script: string;
  audio: string;
  description: string;
  cta: string;
  platform: string;
  editingNotes: string;
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

  keywordsText: string; // single large keyword workspace (one per line)
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
  keywordsText: "",
  competitors: [],
  mercadoLivre: emptyMarketplace(),
  shopee: emptyMarketplace(),
  amazon: emptyMarketplace(),
  tiktok: emptyMarketplace(),
  pricing: emptyPricing(),
  images: [],
  videos: [],
});
