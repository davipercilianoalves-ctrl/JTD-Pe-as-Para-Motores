import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "danger" | "warning" | "neutral";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

interface PendingConfirm extends ConfirmOptions {
  id: number;
  resolve: (v: boolean) => void;
}

const ConfirmContext = createContext<
  ((opts: ConfirmOptions) => Promise<boolean>) | null
>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const idRef = useRef(0);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      idRef.current += 1;
      setPending({ id: idRef.current, resolve, ...opts });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      if (!pending) return;
      pending.resolve(value);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        close(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [pending, close]);

  const tone: Tone = pending?.tone ?? "danger";
  const toneRing = {
    danger: "ring-primary/40",
    warning: "ring-warning/40",
    neutral: "ring-border",
  }[tone];
  const toneIconBg = {
    danger: "bg-primary/12 text-primary",
    warning: "bg-warning/15 text-warning",
    neutral: "bg-accent text-foreground",
  }[tone];
  const toneBtn = {
    danger:
      "bg-primary text-primary-foreground hover:opacity-90 shadow-[var(--shadow-red)]",
    warning: "bg-warning text-background hover:opacity-90",
    neutral: "bg-foreground text-background hover:opacity-90",
  }[tone];
  const Icon = tone === "danger" ? Trash2 : tone === "warning" ? AlertTriangle : Info;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => close(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-150"
          />
          {/* Dialog */}
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className={cn(
              "relative w-full max-w-md rounded-2xl bg-surface-elevated p-6 ring-1 shadow-[var(--shadow-elegant)]",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              toneRing,
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "shrink-0 h-11 w-11 rounded-xl flex items-center justify-center",
                  toneIconBg,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2
                  id="confirm-title"
                  className="text-base font-semibold leading-snug"
                >
                  {pending.title}
                </h2>
                {pending.message && (
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {pending.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {pending.cancelLabel ?? "Cancelar"}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => close(true)}
                className={cn(
                  "h-9 px-4 rounded-lg text-sm font-semibold transition-opacity",
                  toneBtn,
                )}
              >
                {pending.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
