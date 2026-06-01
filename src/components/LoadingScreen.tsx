import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo com glow */}
        <div className="mb-10 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.4)] border border-orange-400/30 animate-in zoom-in-50 duration-1000">
          <span className="text-4xl font-black text-white italic tracking-tighter">JTD</span>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          {/* Spinner laranja */}
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-orange-500/10" />
            <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.4em] text-white uppercase italic animate-pulse">
              Carregando o Sistema
            </span>
            <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-1/2 animate-[loading_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
}
