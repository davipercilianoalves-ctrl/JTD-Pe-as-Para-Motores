import { useEffect, useRef, useState } from "react";
import { Download, Upload, HardDrive, Database, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  exportData,
  importData,
  getStorageUsage,
  STORAGE_LIMIT,
} from "@/lib/backup";
import { useConfirm } from "@/components/ConfirmProvider";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SettingsScreen() {
  const confirm = useConfirm();
  const { goHome } = useStore();
  const [usage, setUsage] = useState(() => getStorageUsage());
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setUsage(getStorageUsage()), 1500);
    return () => window.clearInterval(id);
  }, []);

  const handleExport = () => {
    try {
      exportData("jtd-motors");
      toast.success("Backup exportado");
    } catch {
      toast.error("Não foi possível exportar");
    }
  };

  const handleImportClick = async () => {
    const ok = await confirm({
      title: "Restaurar backup?",
      message:
        "Isso vai substituir todos os dados atuais. Deseja continuar?",
      confirmLabel: "Sim, restaurar",
      tone: "danger",
    });
    if (!ok) return;
    fileInput.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await importData(file);
      toast.success("Dados restaurados com sucesso");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Arquivo inválido ou corrompido",
      );
    }
  };

  const pct = Math.min(100, usage.percent);
  const barTone =
    pct > 90 ? "bg-primary" : pct > 70 ? "bg-warning" : "bg-foreground/70";

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-3xl px-8 py-10">
        <button
          onClick={goHome}
          className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seus dados e o armazenamento local do app.
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
          <div className="flex items-center gap-2.5">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Dados e Backup</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Exporte seus dados regularmente para não perder produtos, anúncios e
            configurações.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-[var(--shadow-red)] transition-opacity"
            >
              <Download className="h-4 w-4" /> Exportar dados
            </button>
            <button
              onClick={handleImportClick}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-background text-sm font-medium hover:bg-accent transition-colors"
            >
              <Upload className="h-4 w-4" /> Importar backup
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface-elevated p-6">
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Armazenamento</h2>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-sm text-muted-foreground">
              Armazenamento usado:{" "}
              <span className="text-foreground font-medium">
                {usage.usedMB.toFixed(2)} MB
              </span>{" "}
              de {STORAGE_LIMIT} MB
            </div>
            <div className="text-sm font-semibold tabular-nums">
              {pct.toFixed(0)}%
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-accent overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barTone)}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct > 70 && (
            <p
              className={cn(
                "mt-3 text-xs",
                pct > 90 ? "text-primary" : "text-warning",
              )}
            >
              {pct > 90
                ? "Armazenamento crítico. Exporte seus dados agora."
                : "Armazenamento em 70%. Faça um backup dos seus dados."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
