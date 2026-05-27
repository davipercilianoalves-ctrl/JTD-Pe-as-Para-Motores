import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { getStorageUsage } from "@/lib/backup";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "jtd:storage-banner-dismissed-bucket";

export function StorageBanner() {
  const { openSettings } = useStore();
  const [pct, setPct] = useState(0);
  const [dismissedBucket, setDismissedBucket] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissedBucket(localStorage.getItem(DISMISS_KEY));
    } catch {
      /* ignore */
    }
    const tick = () => setPct(getStorageUsage().percent);
    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, []);

  const bucket = pct > 90 ? "critical" : pct > 70 ? "warn" : null;
  if (!bucket || bucket === dismissedBucket) return null;

  const critical = bucket === "critical";

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, bucket);
    } catch {
      /* ignore */
    }
    setDismissedBucket(bucket);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-[12px] border-b",
        critical
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-warning/10 border-warning/30 text-warning",
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">
        {critical
          ? "Armazenamento crítico. Exporte seus dados agora."
          : "Armazenamento em 70%. Faça um backup dos seus dados."}
      </span>
      <button
        onClick={openSettings}
        className="font-semibold underline-offset-2 hover:underline"
      >
        Abrir configurações
      </button>
      <button
        onClick={dismiss}
        className="opacity-70 hover:opacity-100"
        aria-label="Dispensar aviso"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
