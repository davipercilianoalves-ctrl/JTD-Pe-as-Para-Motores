import { Package2, Plus } from "lucide-react";

export function EmptyState({
  hasProducts,
  onCreate,
}: {
  hasProducts: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-[2.5rem] border border-dashed border-neutral-800/60 bg-neutral-900/20 px-8 py-24 text-center backdrop-blur-sm animate-in fade-in duration-700">
      <div className="mx-auto h-20 w-20 rounded-[1.5rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(249,115,22,0.05)]">
        <Package2 className="h-10 w-10 text-orange-500 opacity-60" />
      </div>
      <div className="text-2xl font-black text-white uppercase tracking-tighter italic mb-3">
        {hasProducts ? "Nenhum resultado" : "Inventário Vazio"}
      </div>
      <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mt-1 max-w-sm mx-auto mb-10">
        {hasProducts
          ? "Ajuste os filtros ou mude sua busca para encontrar o que procura."
          : "Comece a construir seu império adicionando seu primeiro produto agora."}
      </p>
      {!hasProducts && (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-3 h-14 px-10 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-all active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" /> Adicionar Produto
        </button>
      )}
    </div>
  );
}
