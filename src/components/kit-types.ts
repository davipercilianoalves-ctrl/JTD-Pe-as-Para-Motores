import {
  type Keyword,
  type PricingData,
  type ProductImage,
  type MarketplaceData,
  type MarketplaceId,
} from "./types";

export interface KitItem {
  productId: string;
  quantity: number;
}

export interface Kit {
  id: string;
  name: string;
  sku: string;
  type: "identical" | "composed";
  items: KitItem[];
  keywords: Keyword[];
  titles: string[];
  shortDescription: string;
  description: string;
  aiTemplate: string;
  images: ProductImage[];
  pricing: PricingData;
  notes: string;
  createdAt: number;
  updatedAt: number;
}
