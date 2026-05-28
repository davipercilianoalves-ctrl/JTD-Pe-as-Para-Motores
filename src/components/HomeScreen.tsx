import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Star,
  Package2,
  Rows3,
  LayoutGrid,
  List,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Film,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/pricing";
import { evaluateProduct, STATUS_META, type ProductSignal } from "@/lib/product-signal";
import logoUrl from "@/assets/jtd-logo.png";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

type ViewMode = "comfortable" | "compact" | "cards";


const VIEW_KEY = "jtd:home-view";

export function HomeScreen() {
  const { products, createProduct, openProduct, openViral, toggleFavorite } =
    useStore();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("comfortable");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "favorites" | ProductSignal["status"]
  >("all");

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (v === "comfortable" || v === "compact" || v === "cards") setViewMode(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const decorated = useMemo(
    () =>
      products
        .map((p) => ({ p, signal: evaluateProduct(p) }))
        .sort((a, b) => b.p.updatedAt - a.p.updatedAt),
    [products],
  );

  const filtered = useMemo(() => {
    let list = decorated;
    if (statusFilter === "favorites") list = list.filter((d) => d.p.favorite);
    else if (statusFilter !== "all")
      list = list.filter((d) => d.signal.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        ({ p }) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.text.includes(q)) ||
          p.competitors.some(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.notes.toLowerCase().includes(q),
          ),
      );
    }
    return list;
  }, [decorated, statusFilter, query]);

  const stats = useMemo(() => {
    const total = decorated.length;
    const risk = decorated.filter((d) => d.signal.status === "risk").length;
    const attention = decorated.filter(
      (d) => d.signal.status === "attention",
    ).length;
    const incomplete = decorated.filter(
      (d) => d.signal.status === "incomplete",
    ).length;
    const healthy = decorated.filter((d) => d.signal.status === "healthy")
      .length;
    return { total, risk, attention, incomplete, healthy };
  }, [decorated]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1280px] px-10 py-12">
        {/* Brand strip */}
        <header className="flex items-end justify-between gap-8 border-b border-border/60 pb-8 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-3">
              <span className="h-px w-8 bg-primary" />
              JTD · Peças para motores
            </div>
            <h1 className="text-[44px] font-semibold tracking-tight leading-[1.02]">
              Centro de <span className="text-primary">operações</span>
            </h1>
          </div>
          <div className="hidden md:block shrink-0 h-20 w-20 rounded-xl overflow-hidden bg-black ring-1 ring-white/5">
            <img src={logoUrl} alt="JTD" className="h-full w-full object-cover" />
          </div>
        </header>

        {/* Search + quick actions row */}
        <div className="flex items-stretch gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar em tudo — produtos, SKUs, keywords, concorrentes…"
              className="w-full h-12 rounded-xl bg-surface border border-border pl-11 pr-4 text-[15px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
          <button
            onClick={() => createProduct()}
            className="h-12 px-5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[var(--shadow-red)]"
          >
            <Plus className="h-4 w-4" /> Novo produto
          </button>
          <button
            onClick={openViral}
            className="h-12 px-4 inline-flex items-center gap-2 rounded-xl bg-surface border border-border text-sm font-medium hover:bg-surface-elevated transition"
          >
            <Film className="h-4 w-4" /> Biblioteca
          </button>
        </div>

        {/* Operational Stats */}
        <DashboardStats />


        {/* Filter chips + view mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "all", label: "Todos" },
              { key: "favorites", label: "Favoritos" },
              { key: "healthy", label: "Saudáveis" },
              { key: "attention", label: "Atenção" },
              { key: "risk", label: "Risco" },
              { key: "incomplete", label: "Incompletos" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key as typeof statusFilter)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium border transition",
                  statusFilter === t.key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-surface border border-border p-1">
            {[
              { key: "comfortable" as const, icon: Rows3, title: "Confortável" },
              { key: "compact" as const, icon: List, title: "Compacto" },
              { key: "cards" as const, icon: LayoutGrid, title: "Cards" },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  title={v.title}
                  className={cn(
                    "h-7 w-7 inline-flex items-center justify-center rounded-md transition",
                    viewMode === v.key
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Product list — the centerpiece */}
        {filtered.length === 0 ? (
          <EmptyState
            hasProducts={products.length > 0}
            onCreate={() => createProduct()}
          />
        ) : viewMode === "cards" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(({ p, signal }) => (
              <ProductCard
                key={p.id}
                p={p}
                signal={signal}
                onOpen={() => openProduct(p.id)}
                onFav={() => toggleFavorite(p.id)}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden",
            )}
          >
            {filtered.map(({ p, signal }) => (
              <ProductRow
                key={p.id}
                p={p}
                signal={signal}
                compact={viewMode === "compact"}
                onOpen={() => openProduct(p.id)}
                onFav={() => toggleFavorite(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PulseCell({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "metal" | "success" | "warning" | "primary" | "muted";
  icon?: React.ReactNode;
}) {
  const toneClass = {
    metal: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    primary: "text-primary",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="bg-surface px-5 py-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
        {icon}
        {label}
      </div>
      <div className={cn("text-2xl font-semibold tabular-nums", toneClass)}>
        {value}
      </div>
    </div>
  );
}

function ProductRow({
  p,
  signal,
  compact,
  onOpen,
  onFav,
}: {
  p: Product;
  signal: ProductSignal;
  compact: boolean;
  onOpen: () => void;
  onFav: () => void;
}) {
  const meta = STATUS_META[signal.status];
  const mainImg = p.images.find((i) => i.isMain) ?? p.images[0];
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group flex items-center gap-4 px-5 cursor-pointer transition-colors hover:bg-surface-elevated",
        compact ? "py-2.5" : "py-4",
      )}
    >
      {/* Status rail */}
      <div className={cn("h-10 w-0.5 rounded-full", meta.dot)} />

      {/* Thumb */}
      <div
        className={cn(
          "shrink-0 rounded-lg overflow-hidden bg-accent flex items-center justify-center",
          compact ? "h-9 w-9" : "h-12 w-12",
        )}
      >
        {mainImg ? (
          <img
            src={mainImg.dataUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Package2 className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "truncate font-medium",
              compact ? "text-sm" : "text-[15px]",
            )}
          >
            {p.name || "Sem nome"}
          </div>
          {p.favorite && (
            <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
          )}
        </div>
        {!compact && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {[p.sku, p.brand, p.category].filter(Boolean).join(" · ") ||
              "Sem identificação"}
          </div>
        )}
      </div>

      {/* Status pill */}
      <div
        className={cn(
          "hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
          meta.ring,
          meta.text,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
        {meta.label}
      </div>

      {/* Price + margin */}
      <div className="hidden lg:block text-right tabular-nums">
        <div className="text-sm font-semibold">
          {signal.finalPrice > 0 ? brl(signal.finalPrice) : "—"}
        </div>
        <div
          className={cn(
            "text-[11px]",
            signal.margin >= 25
              ? "text-success"
              : signal.margin >= 10
                ? "text-warning"
                : signal.margin > 0
                  ? "text-primary"
                  : "text-muted-foreground",
          )}
        >
          {signal.finalPrice > 0
            ? `${signal.margin.toFixed(1)}% margem`
            : "—"}
        </div>
      </div>

      {/* Fav */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFav();
        }}
        className="opacity-40 group-hover:opacity-100 transition-opacity"
        title="Favoritar"
      >
        <Star
          className={cn(
            "h-4 w-4",
            p.favorite && "fill-warning text-warning opacity-100",
          )}
        />
      </button>
    </div>
  );
}

function ProductCard({
  p,
  signal,
  onOpen,
  onFav,
}: {
  p: Product;
  signal: ProductSignal;
  onOpen: () => void;
  onFav: () => void;
}) {
  const meta = STATUS_META[signal.status];
  const mainImg = p.images.find((i) => i.isMain) ?? p.images[0];
  return (
    <button
      onClick={onOpen}
      className="group text-left rounded-xl border border-border bg-surface hover:border-foreground/20 hover:bg-surface-elevated transition-all overflow-hidden"
    >
      <div className="relative aspect-[16/10] bg-accent overflow-hidden">
        {mainImg ? (
          <img
            src={mainImg.dataUrl}
            alt=""
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {/* Status corner */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white ring-1 ring-white/10">
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          className="absolute top-3 right-3 h-7 w-7 inline-flex items-center justify-center rounded-full bg-black/60 backdrop-blur ring-1 ring-white/10 text-white/80 hover:text-white"
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              p.favorite && "fill-warning text-warning",
            )}
          />
        </button>
      </div>
      <div className="p-4">
        <div className="font-medium truncate">{p.name || "Sem nome"}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {[p.sku, p.brand].filter(Boolean).join(" · ") || "Sem identificação"}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div className="tabular-nums">
            <div className="text-base font-semibold">
              {signal.finalPrice > 0 ? brl(signal.finalPrice) : "—"}
            </div>
            <div
              className={cn(
                "text-[11px]",
                signal.margin >= 25
                  ? "text-success"
                  : signal.margin >= 10
                    ? "text-warning"
                    : signal.margin > 0
                      ? "text-primary"
                      : "text-muted-foreground",
              )}
            >
              {signal.finalPrice > 0
                ? `${signal.margin.toFixed(1)}% margem`
                : "sem preço"}
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {Math.round(signal.completeness * 100)}% pronto
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyState({
  hasProducts,
  onCreate,
}: {
  hasProducts: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-8 py-16 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-4">
        <Package2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-base font-medium">
        {hasProducts ? "Nenhum produto bate com este filtro" : "Nenhum produto ainda"}
      </div>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {hasProducts
          ? "Ajuste os filtros ou limpe a busca para ver tudo."
          : "Crie seu primeiro produto e comece a operar."}
      </p>
      {!hasProducts && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Criar produto
        </button>
      )}
    </div>
  );
}
