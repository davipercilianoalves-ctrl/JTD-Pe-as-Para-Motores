import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Search, Package2, Hash, FileText, Film } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Result =
  | { kind: "product"; id: string; title: string; subtitle: string }
  | {
      kind: "competitor";
      productId: string;
      title: string;
      subtitle: string;
    }
  | { kind: "keyword"; productId: string; title: string; subtitle: string }
  | { kind: "viral"; title: string; subtitle: string };

const CommandPaletteContext = createContext<(() => void) | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openIt = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandPaletteContext.Provider value={openIt}>
      {children}
      {open && <Palette onClose={() => setOpen(false)} />}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx)
    throw new Error("useCommandPalette must be inside <CommandPaletteProvider>");
  return ctx;
}

function Palette({ onClose }: { onClose: () => void }) {
  const { products, viralLibrary, openProduct, openViral } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const out: Result[] = [];
    if (!term) {
      // Recents when empty
      products.slice(0, 8).forEach((p) =>
        out.push({
          kind: "product",
          id: p.id,
          title: p.name || "Sem nome",
          subtitle: [p.sku, p.brand].filter(Boolean).join(" · ") || "produto",
        }),
      );
      return out;
    }
    for (const p of products) {
      if (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      ) {
        out.push({
          kind: "product",
          id: p.id,
          title: p.name || "Sem nome",
          subtitle: [p.sku, p.brand].filter(Boolean).join(" · ") || "produto",
        });
      }
      for (const k of p.keywords) {
        if (k.text.includes(term)) {
          out.push({
            kind: "keyword",
            productId: p.id,
            title: k.display,
            subtitle: `keyword · ${p.name}`,
          });
          break; // only one per product
        }
      }
      for (const c of p.competitors) {
        if (
          c.title.toLowerCase().includes(term) ||
          c.notes.toLowerCase().includes(term) ||
          c.link.toLowerCase().includes(term)
        ) {
          out.push({
            kind: "competitor",
            productId: p.id,
            title: c.title || c.link || "Concorrente",
            subtitle: `concorrente · ${p.name}`,
          });
          break;
        }
      }
    }
    for (const v of viralLibrary) {
      if (
        v.hook.toLowerCase().includes(term) ||
        v.strategy.toLowerCase().includes(term) ||
        v.platform.toLowerCase().includes(term)
      ) {
        out.push({
          kind: "viral",
          title: v.hook || v.platform,
          subtitle: `clip viral · ${v.platform}`,
        });
      }
    }
    return out.slice(0, 30);
  }, [q, products, viralLibrary]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const pick = (r: Result) => {
    if (r.kind === "product") openProduct(r.id);
    else if (r.kind === "keyword" || r.kind === "competitor")
      openProduct(r.productId);
    else if (r.kind === "viral") openViral();
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const r = results[active];
        if (r) pick(r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, active, onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[14vh]">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-150"
      />
      <div className="relative w-full max-w-xl rounded-2xl bg-surface-elevated ring-1 ring-border shadow-[var(--shadow-elegant)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-5 h-14 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos, keywords, concorrentes…"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground/60"
          />
          <kbd className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-auto py-2">
          {results.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhum resultado.
            </div>
          ) : (
            results.map((r, i) => {
              const Icon =
                r.kind === "product"
                  ? Package2
                  : r.kind === "keyword"
                    ? Hash
                    : r.kind === "competitor"
                      ? FileText
                      : Film;
              return (
                <button
                  key={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(r)}
                  className={cn(
                    "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors",
                    i === active
                      ? "bg-accent"
                      : "hover:bg-accent/60",
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.subtitle}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-border px-5 py-2 flex items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span className="ml-auto">⌘K</span>
        </div>
      </div>
    </div>
  );
}
