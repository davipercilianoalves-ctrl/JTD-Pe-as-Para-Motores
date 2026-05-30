import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Search,
  Package2,
  ChevronDown,
  Info,
  Check,
  AlertTriangle,
  Cloud,
  Copy,
  Hash,
  Star,
} from "lucide-react";
import { useStore, useSelectedKit } from "@/lib/store";
import { useConfirm } from "@/components/ConfirmProvider";
import {
  canonKeyword,
  type Kit,
  type KitItem,
  type Product,
  type Keyword,
  type MarketplaceId,
} from "@/lib/types";
import {
  Btn,
  Field,
  SectionTitle,
  TextInput,
  AutoTextArea,
} from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { brl, computePricing } from "@/lib/pricing";
import { PricingSection } from "./ProductWorkspace";
import { FloatingKeywordCloud } from "./KeywordTools";
import { toast } from "sonner";

type MK = MarketplaceId;
const MARKETS: { key: MK; label: string }[] = [
  { key: "mercadoLivre", label: "Mercado Livre" },
  { key: "shopee", label: "Shopee" },
  { key: "amazon", label: "Amazon" },
  { key: "tiktok", label: "TikTok" },
];

const DEFAULT_LIMITS: Record<MK, number> = {
  mercadoLivre: 60,
  shopee: 120,
  amazon: 200,
  tiktok: 80,
};

export function KitsScreen() {
  const { kits, ui, openKit, createKit, goHome } = useStore();
  const selectedKit = useSelectedKit();

  if (ui.kitId && selectedKit) {
    return <KitEditor kit={selectedKit} />;
  }

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1100px] px-12 pt-12 pb-32">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                Workspace
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Kits e Composições</h1>
            </div>
            <Btn onClick={() => createKit()} variant="primary">
              <Plus className="h-4 w-4 mr-2" /> Novo kit
            </Btn>
          </div>

          {kits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/40 rounded-3xl">
              <Package2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-xl font-semibold">Nenhum kit cadastrado</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Crie kits combinando produtos existentes para facilitar a criação de anúncios de conjuntos.
              </p>
              <Btn onClick={() => createKit()} variant="soft" className="mt-6">
                Criar meu primeiro kit
              </Btn>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kits.map((k) => (
                <button
                  key={k.id}
                  onClick={() => openKit(k.id)}
                  className="flex flex-col text-left p-5 rounded-2xl bg-surface border border-border/40 hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold",
                      k.type === "identical" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    )}>
                      {k.type === "identical" ? "Idênticos" : "Composição"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate w-full mb-1">
                    {k.name || "Sem nome"}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">SKU: {k.sku || "---"}</p>
                  
                  <div className="mt-auto pt-4 border-t border-border/40 w-full flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {k.items.length} {k.items.length === 1 ? "produto" : "produtos"}
                    </span>
                    <span className="font-semibold text-foreground">
                      Ver detalhes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KitEditor({ kit }: { kit: Kit }) {
  const { updateKit, deleteKit, openKits, products } = useStore();
  const confirm = useConfirm();
  const [showSelector, setShowSelector] = useState(false);

  const set = (patch: Partial<Kit>) => updateKit(kit.id, patch);

  // Auto-calculated Keywords
  const inheritedKeywords = useMemo(() => {
    const seen = new Set<string>();
    const result: { product: string; keywords: Keyword[] }[] = [];

    kit.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return;

      const productKeywords: Keyword[] = [];
      product.keywords.forEach((kw) => {
        const key = canonKeyword(kw.display);
        if (key && !seen.has(key)) {
          seen.add(key);
          productKeywords.push(kw);
        }
      });

      if (productKeywords.length > 0) {
        result.push({
          product: product.name,
          keywords: productKeywords,
        });
      }
    });

    return result;
  }, [kit.items, products]);

  const totalCost = useMemo(() => {
    return kit.items.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return acc;
      return acc + (product.pricing?.productCost || 0) * item.quantity;
    }, 0);
  }, [kit.items, products]);

  // Sync cost to pricing
  React.useEffect(() => {
    if (kit.pricing.productCost !== totalCost) {
      updateKit(kit.id, (k) => ({
        ...k,
        pricing: { ...k.pricing, productCost: totalCost },
      }));
    }
  }, [totalCost, kit.id, kit.pricing.productCost]);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1100px] px-12 pt-12 pb-32">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={openKits}
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border/40 group-hover:bg-accent transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Voltar para lista</span>
            </button>
            <Btn
              variant="soft"
              className="text-destructive hover:bg-destructive/10"
              onClick={async () => {
                if (await confirm({
                  title: "Excluir Kit?",
                  message: "Esta ação não pode ser desfeita.",
                  confirmLabel: "Excluir kit",
                  tone: "danger"
                })) {
                  deleteKit(kit.id);
                  openKits();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir Kit
            </Btn>
          </div>

          <input
            value={kit.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Nome do Kit"
            className="w-full bg-transparent text-5xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 mb-8"
          />

          {/* Seção 1: Identidade */}
          <section className="mb-16">
            <SectionTitle>Identidade do Kit</SectionTitle>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="SKU do Kit">
                <TextInput value={kit.sku} onChange={(e) => set({ sku: e.target.value })} />
              </Field>
              <Field label="Tipo de Kit">
                <div className="flex gap-2 p-1 rounded-xl bg-surface border border-border/40 w-fit">
                  <button
                    onClick={() => set({ type: "identical" })}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      kit.type === "identical" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Produtos idênticos
                  </button>
                  <button
                    onClick={() => set({ type: "composed" })}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      kit.type === "composed" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Composição
                  </button>
                </div>
              </Field>
            </div>
          </section>

          {/* Seção 2: Produtos */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Produtos que compõem este kit</SectionTitle>
              <Btn size="sm" onClick={() => setShowSelector(true)}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar produto
              </Btn>
            </div>
            
            <div className="space-y-3">
              {kit.items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div key={item.productId} className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border/40">
                    <div className="flex-1 min-w-0">
                      {product ? (
                        <>
                          <div className="font-bold truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-destructive font-bold">
                          <AlertTriangle className="h-4 w-4" /> Produto removido
                        </div>
                      )}
                    </div>
                    
                    {product && (
                      <div className="text-right px-4 border-x border-border/40">
                        <div className="text-[10px] uppercase text-muted-foreground">Custo Unit.</div>
                        <div className="text-sm font-semibold">{brl(product.pricing?.productCost || 0)}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="text-right px-4">
                        <div className="text-[10px] uppercase text-muted-foreground">Qtd</div>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            set({
                              items: kit.items.map((it) => it.productId === item.productId ? { ...it, quantity: val } : it)
                            });
                          }}
                          className="w-16 bg-input/40 rounded-lg px-2 py-1 text-center font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-right px-4 min-w-[100px]">
                      <div className="text-[10px] uppercase text-muted-foreground">Total</div>
                      <div className="text-sm font-bold text-primary">
                        {product ? brl((product.pricing?.productCost || 0) * item.quantity) : "---"}
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (await confirm({
                          title: "Remover do kit?",
                          message: "Este produto será removido da composição.",
                          confirmLabel: "Remover",
                          tone: "danger"
                        })) {
                          set({ items: kit.items.filter((it) => it.productId !== item.productId) });
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              
              {kit.items.length === 0 && (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground italic text-sm">
                  Nenhum produto adicionado. Clique no botão acima para começar.
                </div>
              )}
            </div>
          </section>

          {/* Seção 3: Precificação resumida do Kit */}
          <section className="mb-16">
            <SectionTitle>Precificação do Kit</SectionTitle>
            <div className="p-6 rounded-2xl bg-surface border border-border/40">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/40">
                <span className="text-muted-foreground">Custo total dos produtos</span>
                <span className="text-xl font-bold">{brl(totalCost)}</span>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Preço de Venda">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">R$</span>
                    <input
                      type="number"
                      value={kit.pricing.salePrice}
                      onChange={(e) => set({ pricing: { ...kit.pricing, salePrice: parseFloat(e.target.value) || 0 } })}
                      className="w-full bg-input/40 rounded-xl pl-10 pr-4 py-2.5 outline-none font-bold"
                    />
                  </div>
                </Field>

                <Field label="Taxa Marketplace (%)">
                  <TextInput 
                    type="number" 
                    value={kit.pricing.marketplaceFee} 
                    onChange={(e) => set({ pricing: { ...kit.pricing, marketplaceFee: parseFloat(e.target.value) || 0, marketplaceFeeType: "%" } })} 
                  />
                </Field>

                <Field label="Imposto (%)">
                  <TextInput 
                    type="number" 
                    value={kit.pricing.tax} 
                    onChange={(e) => set({ pricing: { ...kit.pricing, tax: parseFloat(e.target.value) || 0, taxType: "%" } })} 
                  />
                </Field>

                <div className="flex flex-col justify-end pb-1">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Lucro Estimado</div>
                  <div className={cn(
                    "text-xl font-bold",
                    computePricing(kit.pricing).netProfit >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {brl(computePricing(kit.pricing).netProfit)}
                    <span className="text-xs ml-2 opacity-70">
                      ({computePricing(kit.pricing).marginPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 4: Keywords */}
          <section className="mb-16">
            <SectionTitle>Palavras-chave</SectionTitle>
            <div className="space-y-6">
              {inheritedKeywords.map((group) => (
                <div key={group.product}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <Info className="h-3 w-3" /> Origem: {group.product}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.keywords.map((kw) => (
                      <span key={kw.id} className="px-3 py-1 rounded-full bg-accent/50 text-xs font-medium border border-border/40">
                        {kw.display}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              
              <Field label="Palavras exclusivas do kit">
                <AutoTextArea
                  value={kit.keywords.map(k => k.display).join(", ")}
                  onChange={(e) => {
                    const displays = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                    set({
                      keywords: displays.map(d => ({
                        id: crypto.randomUUID(),
                        display: d,
                        text: canonKeyword(d),
                        favorite: false,
                        uses: 1
                      }))
                    });
                  }}
                  placeholder="palavra 1, palavra 2, ..."
                  minRows={2}
                />
              </Field>
            </div>
          </section>

          {/* Seção 5: Notas */}
          <section className="mb-16">
            <SectionTitle>Notas Internas</SectionTitle>
            <AutoTextArea
              value={kit.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Observações sobre este kit..."
              minRows={3}
            />
          </section>
        </div>
      </div>

      {showSelector && (
        <ProductSelectorModal
          onClose={() => setShowSelector(false)}
          onSelect={(ids) => {
            const currentIds = kit.items.map(i => i.productId);
            const newItems = ids
              .filter(id => !currentIds.includes(id))
              .map(id => ({ productId: id, quantity: 1 }));
            set({ items: [...kit.items, ...newItems] });
            setShowSelector(false);
          }}
          selectedIds={kit.items.map(i => i.productId)}
        />
      )}
    </div>
  );
}

function ProductSelectorModal({ onClose, onSelect, selectedIds }: { onClose: () => void, onSelect: (ids: string[]) => void, selectedIds: string[] }) {
  const { products } = useStore();
  const [search, setSearch] = useState("");
  const [localSelection, setLocalSelection] = useState<string[]>([]);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border/40 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-xl font-bold">Adicionar Produtos ao Kit</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className="w-full bg-input/40 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {filtered.map(p => {
            const alreadyIn = selectedIds.includes(p.id);
            const selected = localSelection.includes(p.id);

            return (
              <button
                key={p.id}
                disabled={alreadyIn}
                onClick={() => {
                  if (selected) setLocalSelection(localSelection.filter(id => id !== p.id));
                  else setLocalSelection([...localSelection, p.id]);
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left mb-1",
                  alreadyIn ? "opacity-40 cursor-not-allowed bg-muted/20" : 
                  selected ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                  selected ? "bg-primary border-primary text-white" : "border-border/60 bg-input"
                )}>
                  {selected && <Check className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">SKU: {p.sku || "---"}</div>
                </div>
                {alreadyIn && <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-0.5 bg-muted rounded-md">Já no kit</span>}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground italic">
              Nenhum produto encontrado.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/40 flex gap-3">
          <Btn className="flex-1" variant="soft" onClick={onClose}>Cancelar</Btn>
          <Btn 
            className="flex-1" 
            variant="primary" 
            disabled={localSelection.length === 0}
            onClick={() => onSelect(localSelection)}
          >
            Adicionar {localSelection.length} {localSelection.length === 1 ? "selecionado" : "selecionados"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
