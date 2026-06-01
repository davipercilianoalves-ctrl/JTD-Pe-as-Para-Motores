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
            const dbProducts = localProducts.map(p => mapProductToDb(p, userId));
            const { error } = await supabase.from("products").insert(dbProducts);
            if (error) throw error;
          }

          const kitsRaw = localStorage.getItem(KITS_KEY);
          const localKits = kitsRaw ? (JSON.parse(kitsRaw) as Kit[]) : [];
          if (localKits.length > 0) {
            const dbKits = localKits.map(k => mapKitToDb(k, userId));
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
          console.error("Erro na migração:", error);
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
    setState((s) => ({
      ...s,
      products: [p, ...s.products],
      ui: { ...s.ui, view: "product", selectedId: p.id },
    }));
    return p.id;
  }, []);

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product> | ((p: Product) => Product)) => {
      setState((s) => ({
        ...s,
        products: s.products.map((p) => {
          if (p.id !== id) return p;
          const updated = typeof patch === "function" ? patch(p) : { ...p, ...patch };
          return { ...updated, updatedAt: Date.now() };
        }),
      }));
    },
    [],
  );

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== id),
      ui: {
        ...s.ui,
        selectedId: s.ui.selectedId === id ? null : s.ui.selectedId,
        view: s.ui.selectedId === id ? "home" : s.ui.view,
      },
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p,
      ),
    }));
  }, []);

  const addKeywordTokens = useCallback((productId: string, tokens: string[]) => {
    if (!tokens.length) return;
    setState((s) => ({
      ...s,
      products: s.products.map((p) => {
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
      }),
    }));
  }, []);

  const removeKeyword = useCallback((productId: string, keywordId: string) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === productId
          ? { ...p, keywords: p.keywords.filter((k) => k.id !== keywordId) }
          : p,
      ),
    }));
  }, []);

  const toggleKeywordFavorite = useCallback(
    (productId: string, keywordId: string) => {
      setState((s) => ({
        ...s,
        products: s.products.map((p) =>
          p.id === productId
            ? {
                ...p,
                keywords: p.keywords.map((k) =>
                  k.id === keywordId ? { ...k, favorite: !k.favorite } : k,
                ),
              }
            : p,
        ),
      }));
    },
    [],
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
    setState((s) => ({
      ...s,
      kits: [k, ...s.kits],
      ui: { ...s.ui, view: "kits", kitId: k.id },
    }));
    return k.id;
  }, []);

  const updateKit = useCallback(
    (id: string, patch: Partial<Kit> | ((k: Kit) => Kit)) => {
      setState((s) => ({
        ...s,
        kits: s.kits.map((k) => {
          if (k.id !== id) return k;
          const updated = typeof patch === "function" ? patch(k) : { ...k, ...patch };
          return { ...updated, updatedAt: Date.now() };
        }),
      }));
    },
    [],
  );

  const deleteKit = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      kits: s.kits.filter((k) => k.id !== id),
      ui: {
        ...s.ui,
        kitId: s.ui.kitId === id ? null : s.ui.kitId,
      },
    }));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        ...state,
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
