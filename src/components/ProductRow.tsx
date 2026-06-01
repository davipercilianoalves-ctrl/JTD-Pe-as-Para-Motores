import { Package2, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { brl } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { STATUS_META, type ProductSignal } from "@/lib/product-signal";

export function ProductRow({
  p,
  signal,
  compact,
  onOpen,
  onFav,
}: {
  p: Product;
  signal: ProductSignal;
  compact: boolean;
  onOpen: () => void;
  onFav: () => void;
}) {
  const meta = STATUS_META[signal.status];
  const mainImg = p.images.find((i) => i.isCover) ?? p.images[0];
  
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group flex items-center gap-6 px-8 cursor-pointer transition-all duration-300 hover:bg-orange-500/5 relative",
        compact ? "py-4" : "py-6",
      )}
    >
      <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full shadow-[0_0_15px_currentColor] transition-opacity opacity-0 group-hover:opacity-100", meta.dot)} />

      {/* Thumb */}
      <div
        className={cn(
          "shrink-0 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border border-neutral-800/60 group-hover:border-orange-500/40 transition-all",
          compact ? "h-11 w-11" : "h-16 w-16",
        )}
      >
        {mainImg ? (
          <img
            src={mainImg.dataUrl}
            alt=""
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <Package2 className="h-5 w-5 text-neutral-600 opacity-30" />
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "font-black uppercase tracking-tight italic text-white group-hover:text-orange-500 transition-colors",
              compact ? "text-sm" : "text-lg",
            )}
          >
            {p.name || "Sem nome"}
          </div>
          {p.favorite && (
            <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
          )}
        </div>
        {!compact && (
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mt-1 truncate">
            {[p.sku, p.brand, p.category].filter(Boolean).join(" · ") ||
              "Sem identificação"}
          </div>
        )}
      </div>

      {/* Status pill */}
      <div
        className={cn(
          "hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all",
          meta.ring,
          meta.text,
          "bg-black/20"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]", meta.dot)} />
        {meta.label}
      </div>

      {/* Price + margin */}
      <div className="hidden lg:block text-right tabular-nums min-w-[120px]">
        <div className="text-lg font-black text-white italic tracking-tighter">
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
            : "—"}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          className="p-2 rounded-lg hover:bg-black/40 transition-all"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-all",
              p.favorite ? "fill-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "text-neutral-600"
            )}
          />
        </button>
        <ArrowRight className="h-4 w-4 text-neutral-700 opacity-0 group-hover:opacity-100 group-hover:text-orange-500 transition-all -translate-x-4 group-hover:translate-x-0" />
      </div>
    </div>
  );
}
