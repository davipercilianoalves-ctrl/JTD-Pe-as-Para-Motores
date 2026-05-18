import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { newProduct, type Product, type ViralClip } from "./types";

const STORAGE_KEY = "jtd-motors-hub:v2";

export type View = "home" | "product" | "viral";

interface UIState {
  view: View;
  selectedId: string | null;
  focusedModule: string | null; // key of fullscreen module
  expandedModules: string[]; // keys currently expanded (not fullscreen)
  openCompetitorId: string | null;
}

interface StoreState {
  products: Product[];
  viralLibrary: ViralClip[];
  ui: UIState;
}

interface StoreContextValue extends StoreState {
  // navigation
  goHome: () => void;
  openProduct: (id: string) => void;
  openViral: () => void;
  // modules
  toggleModule: (key: string) => void;
  focusModule: (key: string | null) => void;
  openCompetitor: (id: string | null) => void;
  // products
  createProduct: () => string;
  updateProduct: (id: string, patch: Partial<Product> | ((p: Product) => Product)) => void;
  deleteProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  // viral lib
  addViral: (clip?: Partial<ViralClip>) => string;
  updateViral: (id: string, patch: Partial<ViralClip>) => void;
  deleteViral: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const initialUI: UIState = {
  view: "home",
  selectedId: null,
  focusedModule: null,
  expandedModules: [],
  openCompetitorId: null,
};

function loadState(): StoreState {
  if (typeof window === "undefined")
    return { products: [], viralLibrary: [], ui: initialUI };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: [], viralLibrary: [], ui: initialUI };
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      products: parsed.products ?? [],
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

  const goHome = useCallback(
    () => setUI({ view: "home", focusedModule: null, openCompetitorId: null }),
    [setUI],
  );
  const openProduct = useCallback(
    (id: string) =>
      setUI({ view: "product", selectedId: id, focusedModule: null, openCompetitorId: null }),
    [setUI],
  );
  const openViral = useCallback(
    () => setUI({ view: "viral", focusedModule: null }),
    [setUI],
  );

  const toggleModule = useCallback((key: string) => {
    setState((s) => {
      const has = s.ui.expandedModules.includes(key);
      return {
        ...s,
        ui: {
          ...s.ui,
          expandedModules: has
            ? s.ui.expandedModules.filter((k) => k !== key)
            : [...s.ui.expandedModules, key],
        },
      };
    });
  }, []);

  const focusModule = useCallback(
    (key: string | null) => setUI({ focusedModule: key }),
    [setUI],
  );

  const openCompetitor = useCallback(
    (id: string | null) => setUI({ openCompetitorId: id }),
    [setUI],
  );

  const createProduct = useCallback(() => {
    const p = newProduct();
    setState((s) => ({
      ...s,
      products: [p, ...s.products],
      ui: { ...s.ui, view: "product", selectedId: p.id, focusedModule: null },
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
        toggleModule,
        focusModule,
        openCompetitor,
        createProduct,
        updateProduct,
        deleteProduct,
        toggleFavorite,
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
