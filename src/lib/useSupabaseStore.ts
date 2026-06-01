import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { migrateProduct, type Product, type Kit } from "./types";
import { toast } from "sonner";

export function useSupabaseStore(userId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to map UI Product to Database Product
  const mapProductToDb = (p: Product, userId: string) => ({
    id: p.id,
    user_id: userId,
    name: p.name,
    sku: p.sku,
    original_code: p.originalCode,
    brand: p.brand,
    category: p.category,
    supplier: p.supplier,
    internal_notes: p.internalNotes,
    favorite: p.favorite,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    keywords: p.keywords as any,
    competitors: p.competitors as any,
    niche_faqs: p.niche_faqs,
    mercado_livre: p.mercadoLivre as any,
    shopee: p.shopee as any,
    amazon: p.amazon as any,
    tiktok: p.tiktok as any,
    pricing: p.pricing as any,
    images: p.images as any,
    videos: p.videos as any,
    custom_fields: p.customFields as any,
  });

  // Helper to map UI Kit to Database Kit
  const mapKitToDb = (k: Kit, userId: string) => ({
    id: k.id,
    user_id: userId,
    name: k.name,
    sku: k.sku,
    type: k.type,
    items: k.items as any,
    keywords: k.keywords as any,
    mercado_livre: k.mercadoLivre as any,
    shopee: k.shopee as any,
    amazon: k.amazon as any,
    tiktok: k.tiktok as any,
    images: k.images as any,
    pricing: k.pricing as any,
    notes: k.notes,
    created_at: k.createdAt,
    updated_at: k.updatedAt,
  });

  // Helper to map Database Row to UI Product
  const mapDbToProduct = (row: any): Product => {
    return migrateProduct({
      ...row,
      originalCode: row.original_code,
      internalNotes: row.internal_notes,
      mercadoLivre: row.mercado_livre,
      customFields: row.custom_fields,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  };

  // Helper to map Database Row to UI Kit
  const mapDbToKit = (row: any): Kit => {
    return {
      ...row,
      mercadoLivre: row.mercado_livre,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as Kit;
  };

  useEffect(() => {
    if (!userId) {
      setProducts([]);
      setKits([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [productsRes, kitsRes] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("kits")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (kitsRes.error) throw kitsRes.error;

        if (productsRes.data) {
          setProducts(productsRes.data.map(mapDbToProduct));
        }
        if (kitsRes.data) {
          setKits(kitsRes.data.map(mapDbToKit));
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados do servidor");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  return { 
    products, 
    setProducts, 
    kits, 
    setKits, 
    loading,
    mapProductToDb,
    mapKitToDb
  };
}
