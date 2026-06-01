import { Package2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { brl } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { STATUS_META, type ProductSignal } from "@/lib/product-signal";

export function ProductCard({
  p,
  signal,
  onOpen,
  onFav,
}: {
  p: Product;
  signal: ProductSignal;
  onOpen: () => void;
  onFav: () => void;
}) {
  const meta = STATUS_META[signal.status];
  const mainImg = p.images.find((i) => i.isCover) ?? p.images[0];
  
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer text-left rounded-[2rem] border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl hover:border-orange-500/30 hover:bg-neutral-900/60 transition-all duration-500 overflow-hidden shadow-2xl relative"
    >
      <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
        {mainImg ? (
          <img
            src={mainImg.dataUrl}
            alt=""
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="flex h-full items-center justify-center opacity-20">
            <Package2 className="h-10 w-10 text-neutral-400" />
          </div>
        )}
        
        {/* Status indicator */}
        <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white ring-1 ring-white/10 shadow-2xl">
          <span className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]", meta.text)} />
          {meta.label}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          className="absolute top-4 right-4 h-9 w-9 inline-flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/10 text-white/80 hover:text-orange-500 transition-all shadow-2xl"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-all",
              p.favorite && "fill-orange-500 text-orange-500"
            )}
          />
        </button>
      </div>
      
      <div className="p-8 relative">
        <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-orange-500 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
        
        <div className="text-lg font-black text-white uppercase tracking-tight truncate mb-1 italic group-hover:text-orange-500 transition-colors">
          {p.name || "Sem nome"}
        </div>
        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest truncate mb-6">
          {[p.sku, p.brand].filter(Boolean).join(" · ") || "Sem identificação"}
        </div>
        
        <div className="flex items-end justify-between">
          <div className="tabular-nums">
            <div className="text-2xl font-black text-white tracking-tighter italic">
              {signal.finalPrice > 0 ? brl(signal.finalPrice) : "—"}
            </div>
            <div
              className={cn(
                "text-[10px] font-black uppercase tracking-widest mt-1",
                signal.margin >= 25
                  ? "text-emerald-500"
                  : signal.margin >= 10
                    ? "text-amber-500"
                    : signal.margin > 0
                      ? "text-orange-500"
                      : "text-neutral-600",
              )}
            >
              {signal.finalPrice > 0
                ? `${signal.margin.toFixed(1)}% margem`
                : "sem preço"}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Completo</div>
            <div className="h-1.5 w-20 bg-black/40 rounded-full border border-neutral-800/60 overflow-hidden p-[2px]">
              <div 
                className="h-full bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all duration-1000"
                style={{ width: `${signal.completeness * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
