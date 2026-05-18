import { ChevronDown, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ModuleShellProps {
  moduleKey: string;
  title: string;
  summary?: ReactNode;
  count?: number;
  children: ReactNode;
  /** Optional render when collapsed instead of summary */
  collapsedExtra?: ReactNode;
}

export function ModuleShell({
  moduleKey,
  title,
  summary,
  count,
  children,
  collapsedExtra,
}: ModuleShellProps) {
  const { ui, toggleModule, focusModule } = useStore();
  const expanded = ui.expandedModules.includes(moduleKey);
  const focused = ui.focusedModule === moduleKey;

  if (focused) {
    return (
      <div className="fixed inset-0 z-50 bg-background focus-overlay flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-8 py-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Modo foco
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => focusModule(null)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-accent"
            >
              <Minimize2 className="h-4 w-4" /> Sair do foco
            </button>
            <button
              onClick={() => focusModule(null)}
              className="rounded-lg p-2.5 hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-10 py-10">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={() => toggleModule(moduleKey)}
        className="flex w-full items-center gap-4 px-7 py-5 hover:bg-surface-elevated/60 transition-colors text-left"
      >
        <div className="text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            {typeof count === "number" && (
              <span className="text-base text-muted-foreground">({count})</span>
            )}
          </div>
          {!expanded && summary && (
            <div className="text-sm text-muted-foreground mt-1 truncate">{summary}</div>
          )}
        </div>
        {!expanded && collapsedExtra}
        {expanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              focusModule(moduleKey);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent",
            )}
            title="Modo foco (tela cheia)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Foco
          </button>
        )}
      </button>
      {expanded && (
        <div className="border-t border-border px-7 py-7 module-expand">{children}</div>
      )}
    </section>
  );
}
