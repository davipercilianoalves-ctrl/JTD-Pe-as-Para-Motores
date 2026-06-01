import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] text-white">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
        <span className="text-3xl font-bold text-primary">JTD</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Carregando...</span>
      </div>
    </div>
  );
}
