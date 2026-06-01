import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package2,
  Rows3,
  LayoutGrid,
  List,
  TrendingUp,
  Film,
  Box,
  Megaphone,
  Briefcase,
  History,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { useStore } from "@/lib/store";
import { evaluateProduct, STATUS_META, type ProductSignal } from "@/lib/product-signal";
import logoUrl from "@/assets/jtd-logo.png";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import { ProductRow } from "@/components/ProductRow";
import { EmptyState } from "@/components/EmptyState";

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
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [decorated, statusFilter, query]);

  return (
    <div className="flex-1 overflow-auto bg-black selection:bg-orange-500/30">
      <div className="mx-auto max-w-[1280px] px-8 py-10">
        
        {/* Header Redesenhado */}
        <header className="mb-12">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-orange-500/80 mb-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <span className="h-[2px] w-10 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            JTD · Centro de Operações
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <h1 className="text-6xl font-black tracking-tighter leading-none italic uppercase">
                Painel de{" "}
                <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                  Controle
                </span>
              </h1>
              <p className="text-neutral-500 text-sm font-bold mt-4 max-w-md uppercase tracking-widest">
                Gerencie seus produtos, anúncios e kits em um só lugar
              </p>
            </div>
            
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
              <button
                onClick={() => createProduct()}
                className="h-14 px-8 inline-flex items-center gap-3 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" /> Novo produto
              </button>
            </div>
          </div>
        </header>

        {/* Bento Grid Stats */}
        <DashboardStats />

        {/* Middle Section: Bento Grid */}
        <div className="grid lg:grid-cols-12 gap-6 mb-12">
          {/* Daily Goal - Bento Card */}
          <div className="lg:col-span-7">
            <DailyGoal />
          </div>
          
          {/* Recent Access - Bento Card */}
          <div className="lg:col-span-5">
            <RecentProducts />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/50 p-3 rounded-[2rem]">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar no inventário..."
              className="w-full h-12 rounded-2xl bg-black/40 border border-neutral-800/60 pl-12 pr-4 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {["all", "favorites", "healthy", "attention", "risk"].map((t) => (
              <button
                key={t}
                onClick={() => setStatusFilter(t as any)}
                className={cn(
                  "h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                  statusFilter === t
                    ? "bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                    : "bg-black/20 text-neutral-500 border-neutral-800 hover:text-neutral-300 hover:border-neutral-700"
                )}
              >
                {t === "all" ? "Todos" : t === "favorites" ? "Favoritos" : t}
              </button>
            ))}
          </div>

          <div className="h-10 w-px bg-neutral-800 hidden md:block" />

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-neutral-800/60">
            {[
              { key: "comfortable" as const, icon: Rows3 },
              { key: "compact" as const, icon: List },
              { key: "cards" as const, icon: LayoutGrid },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  className={cn(
                    "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-all",
                    viewMode === v.key
                      ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                      : "text-neutral-600 hover:text-neutral-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Product list */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {filtered.length === 0 ? (
            <EmptyState
              hasProducts={products.length > 0}
              onCreate={() => createProduct()}
            />
          ) : viewMode === "cards" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="rounded-[2rem] border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl divide-y divide-neutral-800/50 overflow-hidden shadow-2xl">
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
    </div>
  );
}

function DashboardStats() {
  const { products } = useStore();
  
  const stats = useMemo(() => {
    const totalProducts = products.length;
    let totalAnnouncements = 0;
    let totalKits = 0;
    
    products.forEach(p => {
      const announcements = (p as any).announcements;
      if (Array.isArray(announcements)) totalAnnouncements += announcements.length;
      const kits = (p as any).kits;
      if (Array.isArray(kits)) totalKits += kits.length;
    });

    const today = new Date().toISOString().slice(0, 10);
    const createdToday = products.filter(
      p => (p.createdAt as any)?.startsWith?.(today)
    ).length;

    return { totalProducts, totalAnnouncements, totalKits, createdToday };
  }, [products]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <StatCard label="Produtos" value={stats.totalProducts} icon={<Box />} color="orange" />
      <StatCard label="Anúncios" value={stats.totalAnnouncements} icon={<Megaphone />} color="amber" />
      <StatCard label="Kits" value={stats.totalKits} icon={<Briefcase />} color="orange" />
      <StatCard label="Criados hoje" value={stats.createdToday} icon={<TrendingUp />} color="amber" />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode, color: "orange" | "amber" }) {
  return (
    <div className="group bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 rounded-[2rem] p-8 hover:border-orange-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.05)] relative overflow-hidden">
      <div className={cn(
        "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700",
        color === "orange" ? "bg-orange-500" : "bg-amber-400"
      )} />
      
      <div className="flex items-center gap-6">
        <div className={cn(
          "h-16 w-16 rounded-[1.25rem] flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110",
          color === "orange" 
            ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
            : "bg-amber-400/10 text-amber-400 border-amber-400/20"
        )}>
          {icon}
        </div>
        <div>
          <div className="text-11px font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 group-hover:text-neutral-400 transition-colors">
            {label}
          </div>
          <div className="text-4xl font-black tabular-nums tracking-tighter text-white italic">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyGoal() {
  const { products } = useStore();
  const [goal, setGoal] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jtd:daily-goal");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (Number.isFinite(parsed) && parsed >= 0) setGoal(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return products.filter(p => (p.createdAt as any)?.startsWith?.(today)).length;
  }, [products]);

  const updateGoal = (val: string) => {
    const parsed = parseInt(val, 10);
    const n = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setGoal(n);
    try { localStorage.setItem("jtd:daily-goal", n.toString()); } catch { }
  };

  const percent = goal > 0 ? Math.min(100, (todayCount / goal) * 100) : 0;
  const reached = goal > 0 && todayCount >= goal;

  return (
    <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 rounded-[2.5rem] p-10 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
        <Target className="h-32 w-32 text-orange-500 -rotate-12" />
      </div>

      <div className="flex items-center justify-between mb-10 relative z-10">
        <h3 className="text-xl font-black uppercase tracking-widest italic flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          Meta Diária
        </h3>
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-neutral-800/60">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Definir:</span>
          <input
            type="number"
            value={goal || ""}
            onChange={(e) => updateGoal(e.target.value)}
            className="w-12 bg-transparent text-sm font-black text-orange-500 outline-none text-center"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <div className="flex items-end justify-between mb-6">
          <div className="animate-in zoom-in-95 duration-700">
            <div className="text-7xl font-black tabular-nums tracking-tighter italic text-white flex items-baseline gap-2">
              {todayCount}
              <span className="text-lg font-black text-neutral-600 uppercase tracking-widest not-italic">/ {goal || "—"}</span>
            </div>
            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mt-2">
              Produtos criados hoje
            </div>
          </div>
          
          {reached && (
            <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-xl border border-green-500/20 text-[10px] font-black uppercase tracking-widest animate-bounce">
              <CheckCircle2 className="h-4 w-4" /> Excelente!
            </div>
          )}
        </div>
        
        <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-neutral-800/60 p-1">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(249,115,22,0.4)]",
              reached ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-orange-600 to-orange-400"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        
        {!goal && (
          <p className="mt-8 text-[10px] font-bold text-neutral-600 uppercase tracking-widest italic flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-orange-500" />
            Estabeleça uma meta para acelerar o motor
          </p>
        )}
      </div>
    </div>
  );
}

function RecentProducts() {
  const { products, openProduct } = useStore();
  
  const recent = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 4);
  }, [products]);

  return (
    <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 rounded-[2.5rem] flex flex-col h-full overflow-hidden shadow-2xl group">
      <div className="px-10 py-8 border-b border-neutral-800/50 flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-widest italic flex items-center gap-3">
          <History className="h-5 w-5 text-orange-500" /> 
          Histórico
        </h3>
        <ArrowRight className="h-4 w-4 text-neutral-600 group-hover:translate-x-1 transition-transform" />
      </div>
      
      <div className="flex-1 divide-y divide-neutral-800/50">
        {recent.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
            <Box className="h-12 w-12 mb-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Nenhum registro</span>
          </div>
        ) : (
          recent.map(p => (
            <div 
              key={p.id}
              onClick={() => openProduct(p.id)}
              className="px-10 py-5 hover:bg-orange-500/5 cursor-pointer transition-all flex items-center justify-between group/item"
            >
              <div className="min-w-0">
                <div className="text-sm font-black text-white uppercase tracking-wider truncate group-hover/item:text-orange-500 transition-colors italic">
                  {p.name || "Produto sem nome"}
                </div>
                <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-1">
                  SKU: {p.sku || "N/D"}
                </div>
              </div>
              <div className="h-8 w-8 rounded-lg bg-neutral-800/50 flex items-center justify-center text-neutral-600 opacity-0 group-hover/item:opacity-100 group-hover/item:bg-orange-500 group-hover/item:text-white transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-6 bg-black/20 text-center">
        <div className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.4em]">
          Últimas atualizações automáticas
        </div>
      </div>
    </div>
  );
}
