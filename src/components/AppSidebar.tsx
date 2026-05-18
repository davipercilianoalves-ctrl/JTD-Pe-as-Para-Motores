import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Star,
  Package,
  FolderTree,
  Home,
  Film,
  Pin,
  PinOff,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Filter = "all" | "favorites" | "categories";

const PIN_KEY = "jtd:sidebar-pinned";
const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 264;
const HOVER_CLOSE_DELAY = 280;

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

  // Pinned = always expanded; otherwise expand on hover only.
  const [pinned, setPinned] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(PIN_KEY);
    return v === null ? true : v === "1";
  });
  const [hovered, setHovered] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PIN_KEY, pinned ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [pinned]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setPinned((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cleanup any pending close timer on unmount
  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const handleEnter = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setHovered(true);
  };

  const handleLeave = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setHovered(false);
      closeTimer.current = null;
    }, HOVER_CLOSE_DELAY);
  };

  const expanded = pinned || hovered;
  const floating = !pinned && hovered;

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

  // Outer wrapper reserves layout space; inner panel can float over content when unpinned.
  // Mouse handlers live on the <aside> itself so the floating (wider) panel still tracks
  // hover correctly — putting them on the narrow wrapper caused the panel to close as soon
  // as the mouse moved into the expanded overlay area.
  return (
    <div
      className="relative h-screen shrink-0 transition-[width] duration-200 ease-out"
      style={{ width: pinned ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
    >
      <aside
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,box-shadow,transform] duration-300 ease-out will-change-[width]",
          floating && "shadow-2xl shadow-black/50",
        )}
        style={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      >
        {/* Brand + pin */}
        <div className="flex items-center justify-between border-b border-sidebar-border">
          <button
            onClick={goHome}
            className={cn(
              "flex items-center gap-3 px-3 py-4 hover:bg-sidebar-accent/40 transition-colors flex-1 min-w-0",
              !expanded && "justify-center px-0",
            )}
            title="JTD Motors Hub"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base">
              J
            </div>
            {expanded && (
              <div className="leading-tight text-left min-w-0">
                <div className="text-sm font-semibold truncate">
                  JTD Motors Hub
                </div>
                <div className="text-xs text-muted-foreground">Workspace</div>
              </div>
            )}
          </button>
          {expanded && (
            <button
              onClick={() => setPinned((v) => !v)}
              className="px-3 py-4 text-muted-foreground hover:text-foreground transition-colors"
              title={
                pinned
                  ? "Desafixar — esconde ao tirar o mouse (Ctrl+B)"
                  : "Fixar barra aberta (Ctrl+B)"
              }
            >
              {pinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Primary nav */}
        <div
          className={cn(
            "flex flex-col gap-0.5 pt-3",
            expanded ? "px-3" : "px-2",
          )}
        >
          <NavItem
            icon={Home}
            label="Início"
            active={ui.view === "home"}
            collapsed={!expanded}
            onClick={goHome}
          />
          <NavItem
            icon={Film}
            label="Biblioteca Viral"
            active={ui.view === "viral"}
            collapsed={!expanded}
            onClick={openViral}
          />
        </div>

        {/* Create */}
        <div className={cn("pt-4", expanded ? "px-3" : "px-2")}>
          <button
            onClick={() => createProduct()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity",
              expanded ? "px-3 py-2.5" : "h-10",
            )}
            title="Novo produto"
          >
            <Plus className="h-4 w-4" />
            {expanded && "Novo produto"}
          </button>
        </div>

        {expanded && (
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
            expanded ? "px-2" : "px-2",
          )}
        >
          {expanded && (
            <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Produtos · {filtered.length}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {filtered.map((p) => {
              const active =
                ui.selectedId === p.id && ui.view === "product";
              if (!expanded) {
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
            {filtered.length === 0 && expanded && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Nenhum produto
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
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
