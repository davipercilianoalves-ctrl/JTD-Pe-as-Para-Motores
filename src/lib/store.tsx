import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { newProduct, type Product } from "./types";

const STORAGE_KEY = "jtd-motors-hub:v1";

interface StoreState {
  products: Product[];
  selectedId: string | null;
}

interface StoreContextValue extends StoreState {
  selectProduct: (id: string | null) => void;
  createProduct: () => string;
  updateProduct: (id: string, patch: Partial<Product> | ((p: Product) => Product)) => void;
  deleteProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): StoreState {
  if (typeof window === "undefined") return { products: [], selectedId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: [], selectedId: null };
    return JSON.parse(raw) as StoreState;
  } catch {
    return { products: [], selectedId: null };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({ products: [], selectedId: null });
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
      // quota — ignore
    }
  }, [state, hydrated]);

  const selectProduct = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedId: id }));
  }, []);

  const createProduct = useCallback(() => {
    const p = newProduct();
    setState((s) => ({ products: [p, ...s.products], selectedId: p.id }));
    return p.id;
  }, []);

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product> | ((p: Product) => Product)) => {
      setState((s) => ({
        ...s,
        products: s.products.map((p) => {
          if (p.id !== id) return p;
          return typeof patch === "function" ? patch(p) : { ...p, ...patch };
        }),
      }));
    },
    [],
  );

  const deleteProduct = useCallback((id: string) => {
    setState((s) => ({
      products: s.products.filter((p) => p.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)),
    }));
  }, []);

  return (
    <StoreContext.Provider
      value={{ ...state, selectProduct, createProduct, updateProduct, deleteProduct, toggleFavorite }}
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
  const { products, selectedId } = useStore();
  return products.find((p) => p.id === selectedId) ?? null;
}
