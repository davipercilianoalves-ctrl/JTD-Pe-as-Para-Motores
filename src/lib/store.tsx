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
  type Product,
  type Keyword,
  type ViralClip,
} from "./types";

const STORAGE_KEY = "jtd-motors-hub:v3";
const LEGACY_KEY = "jtd-motors-hub:v2";

export type View = "home" | "product" | "viral";

interface UIState {
  view: View;
  selectedId: string | null;
}

interface StoreState {
  products: Product[];
  viralLibrary: ViralClip[];
  ui: UIState;
}

interface StoreContextValue extends StoreState {
  goHome: () => void;
  openProduct: (id: string) => void;
  openViral: () => void;

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
}

const StoreContext = createContext<StoreContextValue | null>(null);

const initialUI: UIState = { view: "home", selectedId: null };

function loadState(): StoreState {
  if (typeof window === "undefined")
    return { products: [], viralLibrary: [], ui: initialUI };
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return { products: [], viralLibrary: [], ui: initialUI };
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      products: (parsed.products ?? []).map(migrateProduct),
      viralLibrary: parsed.viralLibrary ?? [],
      ui: { ...initialUI, ...(parsed.ui ?? {}) },
    };
  } catch {
    return { products: [], viralLibrary: [], ui: initialUI };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    products: [],
    viralLibrary: [],
    ui: initialUI,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const setUI = useCallback((patch: Partial<UIState>) => {
    setState((s) => ({ ...s, ui: { ...s.ui, ...patch } }));
  }, []);

  const goHome = useCallback(() => setUI({ view: "home" }), [setUI]);
  const openProduct = useCallback(
    (id: string) => setUI({ view: "product", selectedId: id }),
    [setUI],
  );
  const openViral = useCallback(() => setUI({ view: "viral" }), [setUI]);

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

  return (
    <StoreContext.Provider
      value={{
        ...state,
        goHome,
        openProduct,
        openViral,
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

export type { Keyword };
