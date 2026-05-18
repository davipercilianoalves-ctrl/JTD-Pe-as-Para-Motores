import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Star,
  Package,
  FolderTree,
  Home,
  Film,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Filter = "all" | "favorites" | "categories";

const COLLAPSE_KEY = "jtd:sidebar-collapsed";

export function AppSidebar() {
  const {
    products,
    ui,
    openProduct,
    createProduct,
    goHome,
    openViral,
    toggleFavorite,
  } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const k = p.category.trim() || "Sem categoria";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "favorites") list = list.filter((p) => p.favorite);
    if (filter === "categories" && activeCategory) {
      list = list.filter(
        (p) => (p.category.trim() || "Sem categoria") === activeCategory,
      );
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, filter, activeCategory, query]);

  const initials = (name: string) =>
    (name || "??")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "??";

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-[60px]" : "w-64",
      )}
    >
      {/* Brand + toggle */}
      <div className="flex items-center justify-between border-b border-sidebar-border">
        <button
          onClick={goHome}
          className={cn(
            "flex items-center gap-3 px-3 py-4 hover:bg-sidebar-accent/40 transition-colors flex-1 min-w-0",
            collapsed && "justify-center px-0",
          )}
          title="JTD Motors Hub"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base">
            J
          </div>
          {!collapsed && (
            <div className="leading-tight text-left min-w-0">
              <div className="text-sm font-semibold truncate">JTD Motors Hub</div>
              <div className="text-xs text-muted-foreground">Workspace</div>
            </div>
          )}
        </button>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="px-3 py-4 text-muted-foreground hover:text-foreground"
            title="Recolher (Ctrl+B)"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-2 mt-2 flex items-center justify-center rounded-md py-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          title="Expandir (Ctrl+B)"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* Primary nav */}
      <div className={cn("flex flex-col gap-0.5 pt-3", collapsed ? "px-2" : "px-3")}>
        <NavItem
          icon={Home}
          label="Início"
          active={ui.view === "home"}
          collapsed={collapsed}
          onClick={goHome}
        />
        <NavItem
          icon={Film}
          label="Biblioteca Viral"
          active={ui.view === "viral"}
          collapsed={collapsed}
          onClick={openViral}
        />
      </div>

      {/* Create */}
      <div className={cn("pt-4", collapsed ? "px-2" : "px-3")}>
        <button
          onClick={() => createProduct()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity",
            collapsed ? "h-10" : "px-3 py-2.5",
          )}
          title="Novo produto"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && "Novo produto"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg bg-sidebar-accent px-9 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="px-3 pt-3">
            <div className="flex gap-1 rounded-lg bg-sidebar-accent/60 p-1 text-xs">
              {[
                { key: "all", label: "Todos", icon: Package },
                { key: "favorites", label: "Favs", icon: Star },
                { key: "categories", label: "Cat.", icon: FolderTree },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key as Filter)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
                      filter === t.key
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3 w-3" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filter === "categories" && (
            <div className="px-3 pt-3 max-h-44 overflow-auto">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "w-full text-left text-xs rounded-md px-2.5 py-1.5 hover:bg-sidebar-accent",
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
                    "flex w-full items-center justify-between text-left text-xs rounded-md px-2.5 py-1.5 hover:bg-sidebar-accent",
                    activeCategory === cat && "bg-sidebar-accent",
                  )}
                >
                  <span className="truncate">{cat}</span>
                  <span className="text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Products */}
      <div
        className={cn(
          "mt-4 flex-1 overflow-auto pb-3",
          collapsed ? "px-2" : "px-2",
        )}
      >
        {!collapsed && (
          <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Produtos · {filtered.length}
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {filtered.map((p) => {
            const active = ui.selectedId === p.id && ui.view === "product";
            if (collapsed) {
              return (
                <button
                  key={p.id}
                  onClick={() => openProduct(p.id)}
                  title={`${p.name || "Sem nome"}${p.sku ? ` · ${p.sku}` : ""}`}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  {initials(p.name)}
                </button>
              );
            }
            return (
              <div
                key={p.id}
                onClick={() => openProduct(p.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-2 cursor-pointer transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {p.name || "Sem nome"}
                  </div>
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
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5",
                      p.favorite && "fill-warning text-warning",
                    )}
                  />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && !collapsed && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhum produto
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md text-sm transition-colors",
        collapsed ? "h-10 justify-center" : "px-3 py-2",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {!collapsed && label}
    </button>
  );
}
