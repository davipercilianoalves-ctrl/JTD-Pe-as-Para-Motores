import { useMemo, useState } from "react";
import { Plus, Search, Star, Package, FolderTree, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Filter = "all" | "favorites" | "categories";

export function AppSidebar() {
  const { products, selectedId, selectProduct, createProduct, deleteProduct, toggleFavorite } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const k = p.category.trim() || "Sem categoria";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [products]);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "favorites") list = list.filter((p) => p.favorite);
    if (filter === "categories" && activeCategory) {
      list = list.filter((p) => (p.category.trim() || "Sem categoria") === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.originalCode.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, filter, activeCategory, query]);

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
          J
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">JTD Motors Hub</div>
          <div className="text-[11px] text-muted-foreground">Workspace de produtos</div>
        </div>
      </div>

      {/* Create */}
      <div className="px-3 pt-3">
        <button
          onClick={() => createProduct()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Criar novo produto
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca rápida..."
            className="w-full rounded-md bg-sidebar-accent px-8 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 pt-3">
        <div className="flex gap-1 rounded-md bg-sidebar-accent p-1 text-xs">
          {[
            { key: "all", label: "Todos", icon: Package },
            { key: "favorites", label: "Favoritos", icon: Star },
            { key: "categories", label: "Categorias", icon: FolderTree },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as Filter)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 transition-colors",
                  filter === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category list */}
      {filter === "categories" && (
        <div className="px-3 pt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 px-1">
            Categorias
          </div>
          <div className="flex flex-col gap-0.5 max-h-40 overflow-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "text-left text-xs rounded px-2 py-1.5 hover:bg-sidebar-accent",
                !activeCategory && "bg-sidebar-accent",
              )}
            >
              Todas
            </button>
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex items-center justify-between text-left text-xs rounded px-2 py-1.5 hover:bg-sidebar-accent",
                  activeCategory === cat && "bg-sidebar-accent",
                )}
              >
                <span className="truncate">{cat}</span>
                <span className="text-muted-foreground">{count}</span>
              </button>
            ))}
            {categories.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-2">Nenhuma categoria ainda</div>
            )}
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="mt-3 flex-1 overflow-auto px-2 pb-3">
        <div className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          Lista de produtos ({filtered.length})
        </div>
        <div className="flex flex-col gap-0.5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={cn(
                "group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors",
                selectedId === p.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60",
              )}
              onClick={() => selectProduct(p.id)}
            >
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{p.name || "Sem nome"}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {p.sku || "—"} · {p.brand || "Sem marca"}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(p.id);
                }}
                className="opacity-60 hover:opacity-100"
                aria-label="Favoritar"
              >
                <Star
                  className={cn("h-3.5 w-3.5", p.favorite && "fill-warning text-warning")}
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Excluir "${p.name}"?`)) deleteProduct(p.id);
                }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-destructive"
                aria-label="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">
              Nenhum produto encontrado
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
