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
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [theme]);

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
    pct > 90 ? "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" : pct > 70 ? "bg-amber-500" : "bg-white/40";

  return (
    <div className="flex-1 overflow-auto bg-black selection:bg-orange-500/30">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <button
          onClick={goHome}
          className="mb-10 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-all group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" /> 
          Voltar para Home
        </button>

        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter italic uppercase bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="mt-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            Personalize sua empresa e gerencie seus dados operacionais.
          </p>
        </header>

        <div className="space-y-8">
          {/* Seção Empresa */}
          <section className="rounded-[2.5rem] border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest italic text-white">Sua Empresa</h2>
            </div>
            
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-10 items-center sm:items-start">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className={cn(
                      "h-32 w-32 rounded-[2rem] border-2 border-dashed border-neutral-800 flex items-center justify-center overflow-hidden bg-black/40 transition-all group-hover:border-orange-500/50",
                      settings.logoUrl && "border-solid border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                    )}>
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-10 w-10 text-neutral-700" />
                      )}
                    </div>
                    <button
                      onClick={() => logoFileInput.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"
                    >
                      <Upload className="h-8 w-8 text-white" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => logoFileInput.current?.click()}
                      className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400"
                    >
                      Alterar logo
                    </button>
                    {settings.logoUrl && (
                      <button
                        onClick={() => update({ logoUrl: "" })}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-500"
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

                <div className="flex-1 w-full space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 block ml-1">
                      Nome Comercial
                    </label>
                    <input
                      value={settings.companyName}
                      onChange={(e) => update({ companyName: e.target.value })}
                      placeholder="Ex: JTD Motors"
                      className="w-full h-14 bg-black/40 border border-neutral-700/60 rounded-2xl px-5 text-white placeholder:text-neutral-700 text-sm focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 block ml-1 flex items-center gap-2">
                        <Phone className="h-3 w-3" /> Telefone
                      </label>
                      <input
                        value={settings.phone}
                        onChange={(e) => update({ phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="w-full h-14 bg-black/40 border border-neutral-700/60 rounded-2xl px-5 text-white placeholder:text-neutral-700 text-sm focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 block ml-1 flex items-center gap-2">
                        <Mail className="h-3 w-3" /> Email
                      </label>
                      <input
                        value={settings.email}
                        onChange={(e) => update({ email: e.target.value })}
                        placeholder="contato@empresa.com"
                        className="w-full h-14 bg-black/40 border border-neutral-700/60 rounded-2xl px-5 text-white placeholder:text-neutral-700 text-sm focus:outline-none focus:border-orange-500/60 focus:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Seção Aparência */}
          <section className="rounded-[2.5rem] border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Palette className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest italic text-white">Interface</h2>
            </div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-8 ml-1">
              Personalize o ambiente visual do seu Hub.
            </p>
            
            <div className="flex p-1.5 bg-black/60 border border-neutral-800/60 rounded-[1.5rem] w-fit shadow-inner">
              <button
                onClick={() => toggleTheme("light")}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  theme === "light" 
                    ? "bg-white text-black shadow-lg" 
                    : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                <Sun className="h-4 w-4" /> Claro
              </button>
              <button
                onClick={() => toggleTheme("dark")}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  theme === "dark" 
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                    : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                <Moon className="h-4 w-4" /> Escuro
              </button>
            </div>
          </section>

          {/* Backup e Dados */}
          <section className="rounded-[2.5rem] border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-neutral-500/10 border border-neutral-500/20 flex items-center justify-center text-neutral-400">
                <Database className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest italic text-white">Segurança de Dados</h2>
            </div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-10 ml-1">
              Exporte seus dados regularmente para garantir a integridade da sua operação.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExport}
                className="h-14 px-10 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-3 shadow-xl active:scale-[0.98]"
              >
                <Download className="h-4 w-4" /> Exportar Tudo
              </button>
              <button
                onClick={handleImportClick}
                className="h-14 px-10 rounded-2xl border border-neutral-700 bg-transparent text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-3 active:scale-[0.98]"
              >
                <Upload className="h-4 w-4" /> Restaurar Backup
              </button>
              <input
                ref={backupFileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            <div className="mt-12 pt-10 border-t border-neutral-800/50">
              <div className="flex items-center gap-3 mb-6">
                <HardDrive className="h-4 w-4 text-neutral-600" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Armazenamento Local</h3>
              </div>
              
              <div className="flex items-baseline justify-between mb-4">
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Capacidade:{" "}
                  <span className="text-white font-black italic">
                    {usage.usedMB.toFixed(2)} MB
                  </span>{" "}
                  / {STORAGE_LIMIT} MB
                </div>
                <div className="text-xl font-black tabular-nums text-white italic">
                  {pct.toFixed(0)}%
                </div>
              </div>
              
              <div className="h-3 w-full rounded-full bg-black/60 border border-neutral-800/60 overflow-hidden p-[2px]">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000", barTone)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              
              {pct > 70 && (
                <div className={cn(
                  "mt-6 flex items-center gap-2 p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest",
                  pct > 90 
                    ? "bg-red-500/10 border-red-500/20 text-red-500" 
                    : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                )}>
                  <Database className="h-3 w-3" />
                  {pct > 90
                    ? "Atenção: Espaço crítico. Realize um backup imediatamente!"
                    : "Aviso: Armazenamento acima de 70%. Considere exportar dados."}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
