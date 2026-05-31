import { useEffect, useRef, useState } from "react";
import { 
  Download, 
  Upload, 
  HardDrive, 
  Database, 
  ArrowLeft, 
  Building2, 
  Palette, 
  Sun, 
  Moon, 
  Trash2,
  Camera,
  Mail,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import {
  exportData,
  importData,
  getStorageUsage,
  STORAGE_LIMIT,
} from "@/lib/backup";
import { useConfirm } from "@/components/ConfirmProvider";
import { useStore } from "@/lib/store";
import { cn, compressImage } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { TextInput } from "@/components/ui-kit";

export function SettingsScreen() {
  const confirm = useConfirm();
  const { goHome } = useStore();
  const { settings, update } = useSettings();
  const [usage, setUsage] = useState(() => getStorageUsage());
  const backupFileInput = useRef<HTMLInputElement>(null);
  const logoFileInput = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (localStorage.getItem("jtd:theme") as "light" | "dark") ?? "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    const id = window.setInterval(() => setUsage(getStorageUsage()), 1500);
    return () => window.clearInterval(id);
  }, []);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    try {
      localStorage.setItem("jtd:theme", newTheme);
    } catch {}
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      toast.error("Formato de imagem inválido. Use JPEG, PNG ou WEBP.");
      return;
    }

    try {
      const dataUrl = await compressImage(file, 200, 0.8);
      update({ logoUrl: dataUrl });
      toast.success("Logo atualizada");
    } catch (err) {
      toast.error("Erro ao processar imagem");
    }
    e.target.value = "";
  };

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
    backupFileInput.current?.click();
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
          Personalize sua empresa e gerencie seus dados.
        </p>

        {/* Seção Empresa */}
        <section className="mt-8 rounded-2xl border border-border bg-surface-elevated p-6">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Empresa</h2>
          </div>
          
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className={cn(
                    "h-24 w-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-background/50 transition-colors group-hover:border-primary/50",
                    settings.logoUrl && "border-solid border-primary/20"
                  )}>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <button
                    onClick={() => logoFileInput.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                  >
                    <Upload className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => logoFileInput.current?.click()}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Alterar logo
                  </button>
                  {settings.logoUrl && (
                    <button
                      onClick={() => update({ logoUrl: "" })}
                      className="text-[11px] font-semibold text-destructive hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <input
                  ref={logoFileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Nome da Empresa
                  </label>
                  <TextInput
                    value={settings.companyName}
                    onChange={(e) => update({ companyName: e.target.value })}
                    placeholder="Ex: JTD Motors"
                  />

                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> Telefone
                      </div>
                    </label>
                    <TextInput
                      value={settings.phone}
                      onChange={(e) => update({ phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />

                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> Email
                      </div>
                    </label>
                    <TextInput
                      value={settings.email}
                      onChange={(e) => update({ email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Aparência */}
        <section className="mt-6 rounded-2xl border border-border bg-surface-elevated p-6">
          <div className="flex items-center gap-2.5">
            <Palette className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Aparência</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o tema que melhor se adapta ao seu ambiente de trabalho.
          </p>
          
          <div className="mt-5 flex p-1 bg-background/50 border border-border rounded-xl w-fit">
            <button
              onClick={() => toggleTheme("light")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                theme === "light" 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Sun className="h-4 w-4" /> Claro
            </button>
            <button
              onClick={() => toggleTheme("dark")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                theme === "dark" 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Moon className="h-4 w-4" /> Escuro
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface-elevated p-6">
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
              ref={backupFileInput}
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
