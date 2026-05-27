import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Home,
  Film,
  Pin,
  PinOff,
  Package2,
  Settings as SettingsIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/components/CommandPalette";
import { evaluateProduct, STATUS_META } from "@/lib/product-signal";
import logoUrl from "@/assets/jtd-logo.png";

const PIN_KEY = "jtd:sidebar-pinned";
const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 248;
const HOVER_CLOSE_DELAY = 240;
const RECENT_LIMIT = 8;

export function AppSidebar() {
  const { products, ui, openProduct, createProduct, goHome, openViral, openSettings } =
    useStore();
  const openPalette = useCommandPalette();

  const [pinned, setPinned] = useState(true);
  const [hovered, setHovered] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(PIN_KEY);
      if (v !== null) setPinned(v === "1");
    } catch {
      /* ignore */
    }
  }, []);

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

  const recents = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, RECENT_LIMIT)
        .map((p) => ({ p, signal: evaluateProduct(p) })),
    [products],
  );

  const initials = (name: string) =>
    (name || "??")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "??";

  return (
    <div
      className="relative h-screen shrink-0 transition-[width] duration-200 ease-out"
      style={{ width: pinned ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
    >
      <aside
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "transition-[width,box-shadow] duration-180 ease-out will-change-[width]",
          floating &&
            "shadow-[12px_0_48px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.03]",
        )}
        style={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      >
        {/* Brand */}
        <div className="relative flex items-center h-14 px-2.5">
          <button
            onClick={goHome}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg transition-colors flex-1 min-w-0 h-10 px-1",
              expanded ? "hover:bg-sidebar-accent/60 px-1.5" : "justify-center",
            )}
            title="JTD"
          >
            <div className="h-8 w-8 shrink-0 rounded-md overflow-hidden bg-black ring-1 ring-white/5">
              <img src={logoUrl} alt="JTD" className="h-full w-full object-cover" />
            </div>
            {expanded && (
              <div className="leading-tight text-left min-w-0">
                <div className="text-[12px] font-semibold tracking-[0.16em] uppercase truncate">
                  JTD
                </div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground truncate">
                  Motors
                </div>
              </div>
            )}
          </button>
          {expanded && (
            <button
              onClick={() => setPinned((v) => !v)}
              className="ml-1 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
              title={
                pinned
                  ? "Desafixar (Ctrl+B)"
                  : "Fixar (Ctrl+B)"
              }
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Metal hairline */}
        <div className="mx-2.5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Search trigger */}
        <div className={cn("pt-3", expanded ? "px-2.5" : "px-2")}>
          <button
            onClick={openPalette}
            title="Buscar (Ctrl+K)"
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent/80 transition-colors",
              expanded ? "h-9 px-3" : "h-9 justify-center",
            )}
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {expanded && (
              <>
                <span className="flex-1 text-left text-[13px] text-muted-foreground truncate">
                  Buscar
                </span>
                <kbd className="text-[9px] uppercase tracking-wider text-muted-foreground border border-sidebar-border rounded px-1 py-0.5">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className={cn("flex flex-col gap-0.5 pt-2", expanded ? "px-2.5" : "px-2")}>
          <NavItem
            icon={Home}
            label="Início"
            active={ui.view === "home"}
            collapsed={!expanded}
            onClick={goHome}
          />
          <NavItem
            icon={Package2}
            label="Produtos"
            badge={products.length || undefined}
            active={ui.view === "product"}
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
        </nav>

        {/* Primary CTA */}
        <div className={cn("pt-3", expanded ? "px-2.5" : "px-2")}>
          <button
            onClick={() => createProduct()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-[var(--shadow-red)]",
              expanded ? "h-9" : "h-9",
            )}
            title="Novo produto"
          >
            <Plus className="h-3.5 w-3.5" />
            {expanded && "Novo produto"}
          </button>
        </div>

        {/* Recent products */}
        <div className="mt-5 flex-1 overflow-auto px-2">
          {expanded && (
            <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Recentes
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {recents.map(({ p, signal }) => {
              const active = ui.selectedId === p.id && ui.view === "product";
              const meta = STATUS_META[signal.status];
              if (!expanded) {
                return (
                  <button
                    key={p.id}
                    onClick={() => openProduct(p.id)}
                    title={`${p.name || "Sem nome"} · ${meta.label}`}
                    className={cn(
                      "relative flex h-9 items-center justify-center rounded-md text-[10px] font-semibold transition-colors",
                      active
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                    )}
                    <span className="relative">
                      {initials(p.name)}
                      <span
                        className={cn(
                          "absolute -right-1.5 -bottom-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-sidebar",
                          meta.dot,
                        )}
                      />
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={p.id}
                  onClick={() => openProduct(p.id)}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                  )}
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)}
                    title={meta.label}
                  />
                  <span className="truncate text-[13px] font-medium">
                    {p.name || "Sem nome"}
                  </span>
                </button>
              );
            })}
            {recents.length === 0 && expanded && (
              <div className="px-2.5 py-4 text-[11px] text-muted-foreground">
                Nenhum produto ainda.
              </div>
            )}
          </div>
        </div>

        {/* Footer hairline */}
        <div className="mx-2.5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className={cn("py-2.5", expanded ? "px-3" : "px-2")}>
          <div
            className={cn(
              "text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70",
              !expanded && "text-center",
            )}
          >
            {expanded ? "JTD · v1" : "v1"}
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
  badge,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md text-[13px] transition-colors",
        collapsed ? "h-9 justify-center" : "h-9 px-2.5",
        active
          ? "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {typeof badge === "number" && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
