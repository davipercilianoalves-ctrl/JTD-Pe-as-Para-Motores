import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  newProduct,
  migrateProduct,
  canonKeyword,
  emptyMarketplace,
  emptyPricing,
  type Product,
  type Keyword,
  type ViralClip,
  type Kit,
} from "./types";
import { useAuth } from "./useAuth";
import { useSupabaseStore } from "./useSupabaseStore";
import { supabase } from "./supabase";
import { toast } from "sonner";

const STORAGE_KEY = "jtd-motors-hub:v3";
const KITS_KEY = "jtd:kits";
const LEGACY_KEY = "jtd-motors-hub:v2";

export type View = "home" | "product" | "viral" | "settings" | "kits";

interface UIState {
  view: View;
  selectedId: string | null;
  kitId: string | null;
}

interface StoreState {
  products: Product[];
  viralLibrary: ViralClip[];
  kits: Kit[];
  ui: UIState;
}

interface StoreContextValue extends StoreState {
  dataLoading: boolean;
  goHome: () => void;
  openProduct: (id: string) => void;
  openViral: () => void;
  openSettings: () => void;
  openKits: () => void;
  openKit: (id: string) => void;

  createProduct: () => string;
  updateProduct: (id: string, patch: Partial<Product> | ((p: Product) => Product)) => void;
  deleteProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // keywords (per product)
  addKeywordTokens: (productId: string, tokens: string[]) => void;
  removeKeyword: (productId: string, keywordId: string) => void;
  toggleKeywordFavorite: (productId: string, keywordId: string) => void;

  // viral library
  addViral: (clip?: Partial<ViralClip>) => string;
  updateViral: (id: string, patch: Partial<ViralClip>) => void;
  deleteViral: (id: string) => void;

  // Kits
  createKit: () => string;
  updateKit: (id: string, patch: Partial<Kit> | ((k: Kit) => Kit)) => void;
  deleteKit: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const initialUI: UIState = { view: "home", selectedId: null, kitId: null };

function loadState(): StoreState {
  if (typeof window === "undefined")
    return { products: [], viralLibrary: [], kits: [], ui: initialUI };
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    const kitsRaw = localStorage.getItem(KITS_KEY);
    
    const parsed = raw ? (JSON.parse(raw) as Partial<StoreState>) : {};
    const parsedKits = kitsRaw ? (JSON.parse(kitsRaw) as Kit[]) : [];
    
    return {
      products: (parsed.products ?? []).map(migrateProduct),
      viralLibrary: parsed.viralLibrary ?? [],
      kits: parsedKits,
      ui: { ...initialUI, ...(parsed.ui ?? {}) },
    };
  } catch {
    return { products: [], viralLibrary: [], kits: [], ui: initialUI };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { 
    products, setProducts, 
    kits, setKits, 
    loading: dataLoading,
    mapProductToDb,
    mapKitToDb
  } = useSupabaseStore(user?.id);

  const [state, setState] = useState<StoreState>({
    products: [],
    viralLibrary: [],
    kits: [],
    ui: initialUI,
  });
  const [hydrated, setHydrated] = useState(false);

  // Sync state with hook data
  useEffect(() => {
    setState(s => ({ ...s, products, kits }));
  }, [products, kits]);

  useEffect(() => {
    setState(s => {
      const loaded = loadState();
      return {
        ...s,
        viralLibrary: loaded.viralLibrary,
        ui: loaded.ui,
      };
    });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        viralLibrary: state.viralLibrary,
        ui: state.ui,
      }));
    } catch {
      /* ignore */
    }
  }, [state.viralLibrary, state.ui, hydrated]);

  // Migration logic
  useEffect(() => {
    if (user?.id && hydrated) {
      const migrateLocalStorageToSupabase = async (userId: string) => {
        const migrationKey = `jtd:migrated:${userId}`;
        if (localStorage.getItem(migrationKey)) return;

        try {
          const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
          if (!raw) return;
          const data = JSON.parse(raw);
          const localProducts = (data.products ?? []).map(migrateProduct);
          
          if (localProducts.length > 0) {
            const dbProducts = localProducts.map((p: Product) => mapProductToDb(p, userId));
            const { error } = await supabase.from("products").insert(dbProducts);
            if (error) throw error;
          }

          const kitsRaw = localStorage.getItem(KITS_KEY);
          const localKits = kitsRaw ? (JSON.parse(kitsRaw) as Kit[]) : [];
          if (localKits.length > 0) {
            const dbKits = localKits.map((k: Kit) => mapKitToDb(k, userId));
            const { error } = await supabase.from("kits").insert(dbKits);
            if (error) throw error;
          }

          localStorage.setItem(migrationKey, "true");
          if (localProducts.length > 0 || localKits.length > 0) {
            toast.success(`${localProducts.length} produtos e ${localKits.length} kits migrados para a nuvem!`);
            // Trigger a reload or just rely on the effect
            window.location.reload();
          }
        } catch (error) {
          console.error("Erro na migração:", error.message || error);
        }
      };

      migrateLocalStorageToSupabase(user.id);
    }
  }, [user?.id, hydrated, mapProductToDb, mapKitToDb]);

  const setUI = useCallback((patch: Partial<UIState>) => {
    setState((s) => ({ ...s, ui: { ...s.ui, ...patch } }));
  }, []);

  const goHome = useCallback(() => setUI({ view: "home" }), [setUI]);
  const openProduct = useCallback(
    (id: string) => setUI({ view: "product", selectedId: id }),
    [setUI],
  );
  const openViral = useCallback(() => setUI({ view: "viral" }), [setUI]);
  const openSettings = useCallback(() => setUI({ view: "settings" }), [setUI]);
  const openKits = useCallback(() => setUI({ view: "kits", kitId: null }), [setUI]);
  const openKit = useCallback(
    (id: string) => setUI({ view: "kits", kitId: id }),
    [setUI],
  );

  const createProduct = useCallback(() => {
    const p = newProduct();
    if (user?.id) {
      // Optimistic update
      setProducts(prev => [p, ...prev]);
      setUI({ view: "product", selectedId: p.id });

      supabase.from("products").insert(mapProductToDb(p, user.id)).then(({ error }) => {
        if (error) {
          console.error("Erro ao criar produto:", error.message);
          setProducts(prev => prev.filter(x => x.id !== p.id));
          toast.error("Erro ao salvar produto");
        }
      });
    }
    return p.id;
  }, [user?.id, setProducts, setUI, mapProductToDb]);

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product> | ((p: Product) => Product)) => {
      setProducts((prev) => {
        const updatedList = prev.map((p: Product) => {
          if (p.id !== id) return p;
          const updated = typeof patch === "function" ? patch(p) : { ...p, ...patch };
          return { ...updated, updatedAt: Date.now() };
        });

        const product = updatedList.find(p => p.id === id);
        if (product && user?.id) {
          supabase.from("products")
            .update(mapProductToDb(product, user.id))
            .eq("id", id)
            .eq("user_id", user.id)
            .then(({ error }) => {
              if (error) console.error("Erro ao atualizar produto:", error.message);
            });
        }
        return updatedList;
      });
    },
    [user?.id, setProducts, mapProductToDb],
  );

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setUI({
      selectedId: state.ui.selectedId === id ? null : state.ui.selectedId,
      view: state.ui.selectedId === id ? "home" : state.ui.view,
    });

    if (user?.id) {
      supabase.from("products").delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.error("Erro ao deletar produto:", error.message);
        });
    }
  }, [user?.id, setProducts, setUI, state.ui]);

  const toggleFavorite = useCallback((id: string) => {
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p,
      );
      const product = updated.find(p => p.id === id);
      if (product && user?.id) {
        supabase.from("products")
          .update({ favorite: product.favorite })
          .eq("id", id)
          .eq("user_id", user.id)
          .then(({ error }) => {
            if (error) console.error("Erro ao favoritar produto:", error.message);
          });
      }
      return updated;
    });
  }, [user?.id, setProducts]);

  const addKeywordTokens = useCallback((productId: string, tokens: string[]) => {
    if (!tokens.length) return;
    setProducts((prev) => {
      const updatedList = prev.map((p) => {
        if (p.id !== productId) return p;
        const next = [...p.keywords];
        for (const raw of tokens) {
          const text = canonKeyword(raw);
          if (!text) continue;
          const existing = next.find((k) => k.text === text);
          if (existing) existing.uses += 1;
          else
            next.push({
              id: crypto.randomUUID(),
              text,
              display: raw.trim(),
              favorite: false,
              uses: 1,
            });
        }
        return { ...p, keywords: next, updatedAt: Date.now() };
      });

      const product = updatedList.find(p => p.id === productId);
      if (product && user?.id) {
        supabase.from("products")
          .update({ keywords: product.keywords as any, updated_at: product.updatedAt })
          .eq("id", productId)
          .eq("user_id", user.id)
          .then(({ error }) => {
            if (error) console.error("Erro ao atualizar palavras-chave:", error.message);
          });
      }
      return updatedList;
    });
  }, [user?.id, setProducts]);

  const removeKeyword = useCallback((productId: string, keywordId: string) => {
    setProducts((prev) => {
      const updatedList = prev.map((p) =>
        p.id === productId
          ? { ...p, keywords: p.keywords.filter((k) => k.id !== keywordId) }
          : p,
      );
      const product = updatedList.find(p => p.id === productId);
      if (product && user?.id) {
        supabase.from("products")
          .update({ keywords: product.keywords as any })
          .eq("id", productId)
          .eq("user_id", user.id)
          .then(({ error }) => {
            if (error) console.error("Erro ao remover palavra-chave:", error.message);
          });
      }
      return updatedList;
    });
  }, [user?.id, setProducts]);

  const toggleKeywordFavorite = useCallback(
    (productId: string, keywordId: string) => {
      setProducts((prev) => {
        const updatedList = prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                keywords: p.keywords.map((k) =>
                  k.id === keywordId ? { ...k, favorite: !k.favorite } : k,
                ),
              }
            : p,
        );
        const product = updatedList.find(p => p.id === productId);
        if (product && user?.id) {
          supabase.from("products")
            .update({ keywords: product.keywords as any })
            .eq("id", productId)
            .eq("user_id", user.id)
            .then(({ error }) => {
              if (error) console.error("Erro ao favoritar palavra-chave:", error.message);
            });
        }
        return updatedList;
      });
    },
    [user?.id, setProducts],
  );

  const addViral = useCallback((clip?: Partial<ViralClip>) => {
    const c: ViralClip = {
      id: crypto.randomUUID(),
      link: "",
      platform: "TikTok",
      views: "",
      hook: "",
      strategy: "",
      structure: "",
      audio: "",
      notes: "",
      editType: "",
      createdAt: Date.now(),
      ...clip,
    };
    setState((s) => ({ ...s, viralLibrary: [c, ...s.viralLibrary] }));
    return c.id;
  }, []);

  const updateViral = useCallback((id: string, patch: Partial<ViralClip>) => {
    setState((s) => ({
      ...s,
      viralLibrary: s.viralLibrary.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteViral = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      viralLibrary: s.viralLibrary.filter((c) => c.id !== id),
    }));
  }, []);

  const createKit = useCallback(() => {
    const k: Kit = {
      id: crypto.randomUUID(),
      name: "Novo Kit",
      sku: "",
      type: "identical",
      items: [],
      keywords: [],
      mercadoLivre: emptyMarketplace(),
      shopee: emptyMarketplace(),
      amazon: emptyMarketplace(),
      tiktok: emptyMarketplace(),
      images: [],
      pricing: emptyPricing(),
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (user?.id) {
      setKits(prev => [k, ...prev]);
      setUI({ view: "kits", kitId: k.id });

      supabase.from("kits").insert(mapKitToDb(k, user.id)).then(({ error }) => {
        if (error) {
          console.error("Erro ao criar kit:", error.message);
          setKits(prev => prev.filter(x => x.id !== k.id));
          toast.error("Erro ao salvar kit");
        }
      });
    }
    return k.id;
  }, [user?.id, setKits, setUI, mapKitToDb]);

  const updateKit = useCallback(
    (id: string, patch: Partial<Kit> | ((k: Kit) => Kit)) => {
      setKits((prev) => {
        const updatedList = prev.map((k) => {
          if (k.id !== id) return k;
          const updated = typeof patch === "function" ? patch(k) : { ...k, ...patch };
          return { ...updated, updatedAt: Date.now() };
        });

        const kit = updatedList.find(k => k.id === id);
        if (kit && user?.id) {
          supabase.from("kits")
            .update(mapKitToDb(kit, user.id))
            .eq("id", id)
            .eq("user_id", user.id)
            .then(({ error }) => {
              if (error) console.error("Erro ao atualizar kit:", error.message);
            });
        }
        return updatedList;
      });
    },
    [user?.id, setKits, mapKitToDb],
  );

  const deleteKit = useCallback((id: string) => {
    setKits((prev) => prev.filter((k) => k.id !== id));
    setUI({
      kitId: state.ui.kitId === id ? null : state.ui.kitId,
    });

    if (user?.id) {
      supabase.from("kits").delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.error("Erro ao deletar kit:", error.message);
        });
    }
  }, [user?.id, setKits, setUI, state.ui]);

  return (
    <StoreContext.Provider
      value={{
        ...state,
        dataLoading,
        goHome,
        openProduct,
        openViral,
        openSettings,
        openKits,
        openKit,
        createProduct,
        updateProduct,
        deleteProduct,
        toggleFavorite,
        addKeywordTokens,
        removeKeyword,
        toggleKeywordFavorite,
        addViral,
        updateViral,
        deleteViral,
        createKit,
        updateKit,
        deleteKit,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useSelectedProduct() {
  const { products, ui } = useStore();
  return products.find((p) => p.id === ui.selectedId) ?? null;
}

export function useSelectedKit() {
  const { kits, ui } = useStore();
  return kits.find((k) => k.id === ui.kitId) ?? null;
}

export type { Keyword };
