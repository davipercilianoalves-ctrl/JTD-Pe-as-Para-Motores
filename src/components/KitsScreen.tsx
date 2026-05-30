"use client";
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

  const [market, setMarket] = useState<MK>("mercadoLivre");
  const [showCloud, setShowCloud] = useState(false);

  const allKeywords = useMemo(() => {
    const list: { text: string; source: string }[] = [];
    inheritedKeywords.forEach(g => {
      g.keywords.forEach(kw => list.push({ text: kw.display, source: `Produto: ${g.product}` }));
    });
    kit.keywords.forEach(kw => list.push({ text: kw.display, source: "Exclusiva Kit" }));
    return list;
  }, [inheritedKeywords, kit.keywords]);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1100px] px-12 pt-12 pb-32">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={openKits}
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border/40 group-hover:bg-accent transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Voltar para lista</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCloud(true)}
                className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40"
              >
                <Cloud className="h-3.5 w-3.5" /> Ver todas as palavras
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
                <Trash2 className="h-4 w-4" />
              </Btn>
            </div>
          </div>

          <input
            value={kit.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Nome do Kit"
            className="w-full bg-transparent text-5xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 mb-2"
          />
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-border/40">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">SKU</span>
              <input
                value={kit.sku}
                onChange={(e) => set({ sku: e.target.value })}
                className="bg-transparent text-sm font-bold outline-none w-24"
                placeholder="SKU-KIT"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border/40">
              <button
                onClick={() => set({ type: "identical" })}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  kit.type === "identical" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Produtos idênticos
              </button>
              <button
                onClick={() => set({ type: "composed" })}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  kit.type === "composed" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Composição
              </button>
            </div>
          </div>

          <div className="mt-12">
            <KitKeywordsSection kit={kit} inheritedKeywords={inheritedKeywords} />
          </div>

          {/* Seção 2: Produtos */}
          <section className="mt-16">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle hint="Produtos que compõem este kit e seus respectivos custos unitários.">
                Produtos do Kit
              </SectionTitle>
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

              {kit.items.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-border/40">
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-muted-foreground mb-1">Custo total dos itens</div>
                    <div className="text-2xl font-bold">{brl(totalCost)}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="mt-20 flex items-center gap-1 rounded-xl bg-surface p-1 w-fit">
            {MARKETS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMarket(m.key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-colors",
                  market === m.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-16">
            <KitConsolidatedKeywords kit={kit} inheritedKeywords={inheritedKeywords} />
            <KitTitlesSection kit={kit} market={market} inheritedKeywords={inheritedKeywords} />
            <KitDescriptionSection kit={kit} market={market} />
          </div>

          {/* Seção 5: Precificação */}
          <section className="mt-16">
            <PricingSection
              pricing={kit.pricing}
              onUpdate={(patch) =>
                updateKit(kit.id, (k) => ({
                  ...k,
                  pricing: { ...k.pricing, ...patch }
                }))
              }
            />
          </section>

          {/* Seção 6: Notas */}
          <section className="mt-16">
            <SectionTitle hint="Observações gerais sobre este kit.">Notas Internas</SectionTitle>
            <AutoTextArea
              value={kit.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Observações sobre este kit..."
              className="bg-surface p-5 rounded-2xl border border-border/40"
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

      {showCloud && (
        <FloatingKeywordCloud
          keywords={allKeywords}
          onClose={() => setShowCloud(false)}
          productName={kit.name}
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

function KitKeywordsSection({ kit, inheritedKeywords }: { kit: Kit; inheritedKeywords: { product: string; keywords: Keyword[] }[] }) {
  const { updateKit } = useStore();
  const [draft, setDraft] = useState("");

  const commit = () => {
    const toks = draft
      .split(/[\s,\n]+/)
      .map(t => t.trim())
      .filter(Boolean);
    
    if (!toks.length) return;

    const existing = new Set(kit.keywords.map(k => canonKeyword(k.display)));
    inheritedKeywords.forEach(g => g.keywords.forEach(kw => existing.add(canonKeyword(kw.display))));

    const fresh = toks.filter(t => {
      const key = canonKeyword(t);
      return key && !existing.has(key);
    });

    if (fresh.length) {
      updateKit(kit.id, (k) => ({
        ...k,
        keywords: [
          ...k.keywords,
          ...fresh.map(t => ({
            id: crypto.randomUUID(),
            display: t,
            text: canonKeyword(t),
            favorite: false,
            uses: 1,
          }))
        ]
      }));
    }
    setDraft("");
  };

  return (
    <section>
      <SectionTitle hint="Palavras-chave exclusivas do kit que complementam as herdadas.">
        Palavras-chave exclusivas
      </SectionTitle>
      <div className="flex gap-2 mb-4">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Adicionar palavras exclusivas (separe por vírgula ou Enter)..."
          onKeyDown={(e) => e.key === "Enter" && commit()}
        />
        <Btn onClick={commit} variant="primary">Adicionar</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {kit.keywords.map((k) => (
          <div key={k.id} className="group flex items-center justify-between p-2 rounded-lg bg-surface border border-border/40 hover:border-primary/40 transition-colors">
            <span className="text-sm truncate">{k.display}</span>
            <button 
              onClick={() => updateKit(kit.id, (prev) => ({ ...prev, keywords: prev.keywords.filter(kw => kw.id !== k.id) }))} 
              className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function KitConsolidatedKeywords({ kit, inheritedKeywords }: { kit: Kit; inheritedKeywords: { product: string; keywords: Keyword[] }[] }) {
  const copyAll = () => {
    const all = [
      ...inheritedKeywords.flatMap(g => g.keywords.map(k => k.display)),
      ...kit.keywords.map(k => k.display)
    ];
    navigator.clipboard.writeText(all.join(", "));
    toast.success("Todas as palavras copiadas!");
  };

  return (
    <section>
      <SectionTitle 
        hint="Lista completa de palavras-chave (herdadas + exclusivas)."
        action={<Btn size="sm" variant="soft" onClick={copyAll}><Copy className="h-3.5 w-3.5 mr-1" /> Copiar todas</Btn>}
      >
        Nuvem de Palavras Consolidadas
      </SectionTitle>
      
      <div className="space-y-4">
        {inheritedKeywords.map((group) => (
          <div key={group.product} className="bg-surface/30 p-4 rounded-xl border border-border/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Package2 className="h-3 w-3" /> Herdadas de: {group.product}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.keywords.map((kw) => (
                <span key={kw.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground border border-border/40">
                  {kw.display}
                </span>
              ))}
            </div>
          </div>
        ))}

        {kit.keywords.length > 0 && (
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-3 flex items-center gap-2">
              <Star className="h-3 w-3" /> Exclusivas do Kit
            </div>
            <div className="flex flex-wrap gap-2">
              {kit.keywords.map((kw) => (
                <span key={kw.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {kw.display}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function KitTitlesSection({ kit, market, inheritedKeywords }: { kit: Kit; market: MK; inheritedKeywords: { product: string; keywords: Keyword[] }[] }) {
  const { updateKit } = useStore();
  const [showKeywordBox, setShowKeywordBox] = useState(false);
  
  const data = (kit as any)[market] || { titles: [""], titleLimit: DEFAULT_LIMITS[market] };
  const limit = data.titleLimit || DEFAULT_LIMITS[market];
  const titles = (data.titles ?? []).length > 0 ? data.titles : [""];

  const upd = (idx: number, newValue: string) => {
    updateKit(kit.id, (k) => ({
      ...k,
      [market]: {
        ...((k as any)[market] || {}),
        titles: (titles).map((t: string, i: number) => i === idx ? newValue.slice(0, limit) : t),
      },
    }));
  };

  const setLimit = (val: number) => {
    updateKit(kit.id, (k) => ({
      ...k,
      [market]: {
        ...((k as any)[market] || {}),
        titleLimit: val,
      },
    }));
  };

  const add = () => {
    updateKit(kit.id, (k) => ({
      ...k,
      [market]: {
        ...((k as any)[market] || {}),
        titles: [...titles, ""],
      },
    }));
  };

  const rm = (idx: number) => {
    updateKit(kit.id, (k) => {
      let nextTitles = titles.filter((_: any, i: number) => i !== idx);
      if (nextTitles.length === 0) nextTitles = [""];
      return {
        ...k,
        [market]: {
          ...((k as any)[market] || {}),
          titles: nextTitles,
        },
      };
    });
  };

  const allKeywords = useMemo(() => {
    const list: { text: string; source: string }[] = [];
    inheritedKeywords.forEach(g => g.keywords.forEach(kw => list.push({ text: kw.display, source: g.product })));
    kit.keywords.forEach(kw => list.push({ text: kw.display, source: "Exclusiva Kit" }));
    return list;
  }, [inheritedKeywords, kit.keywords]);

  return (
    <section>
      <SectionTitle 
        hint="Crie múltiplos títulos para o kit neste marketplace."
        action={
          <button
            onClick={() => setShowKeywordBox(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Cloud className="h-3.5 w-3.5" /> Palavras disponíveis
          </button>
        }
      >
        Títulos
      </SectionTitle>

      <div className="mb-6 flex items-center gap-3 bg-surface/50 p-3 rounded-xl border border-border/40 w-fit">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Limite</label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value) || 0)}
          className="w-16 bg-background border border-border/60 rounded-lg px-2 py-1 text-sm font-bold tabular-nums outline-none focus:border-primary/40"
        />
      </div>

      <div className="space-y-3">
        {titles.map((text: string, i: number) => (
          <TitleField
            key={i}
            value={text}
            onChange={(val) => upd(i, val)}
            onRemove={() => rm(i)}
            autoFocus={i === titles.length - 1 && i > 0 && !text}
            limit={limit}
          />
        ))}
        <button
          onClick={add}
          className="w-full py-3 rounded-xl border border-dashed border-border/60 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Adicionar título
        </button>
      </div>

      {showKeywordBox && (
        <FloatingKeywordCloud
          keywords={allKeywords}
          onClose={() => setShowKeywordBox(false)}
          productName="Palavras do Kit"
        />
      )}
    </section>
  );
}

function TitleField({ 
  value, 
  onChange, 
  onRemove,
  autoFocus,
  limit
}: { 
  value: string; 
  onChange: (v: string) => void; 
  onRemove: () => void;
  autoFocus?: boolean;
  limit: number;
}) {
  const count = (value || "").length;
  const counterClass =
    count >= limit
      ? "text-red-500"
      : count >= limit * 0.9
        ? "text-yellow-500"
        : "text-muted-foreground";

  return (
    <div className="group relative">
      <div className={cn(
        "flex items-center gap-3 bg-surface px-5 py-3.5 rounded-xl border transition-all",
        count >= limit ? "border-red-500 ring-1 ring-red-500/20" : "border-border/40 focus-within:border-primary/40"
      )}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o título do kit..."
          maxLength={limit}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-muted-foreground/30"
        />
        <div className="flex items-center gap-3">
          <span className={cn("text-[11px] font-bold tabular-nums tracking-wider", counterClass)}>
            {count}/{limit}
          </span>
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function KitDescriptionSection({ kit, market }: { kit: Kit; market: MK }) {
  const { updateKit } = useStore();
  const data = (kit as any)[market] || { shortDescription: "", description: "" };

  const set = (patch: Partial<any>) => {
    updateKit(kit.id, (k) => ({
      ...k,
      [market]: { ...((k as any)[market] || {}), ...patch }
    }));
  };

  const [showAI, setShowAI] = useState(false);

  return (
    <div className="space-y-12">
      <section>
        <SectionTitle hint="Resumo do kit para este marketplace.">
          Breve descrição
        </SectionTitle>
        <div className="rounded-2xl bg-surface p-5 border border-border/40 focus-within:border-primary/40 transition-colors">
          <AutoTextArea
            value={data.shortDescription || ""}
            onChange={(e) => set({ shortDescription: e.target.value })}
            placeholder="Resumo do kit..."
            className="text-[15px] leading-relaxed"
            minRows={3}
          />
        </div>
      </section>

      <section>
        <SectionTitle hint="Descrição completa do kit.">
          Descrição completa
        </SectionTitle>
        <div className="space-y-4">
          <Btn variant="soft" className="w-full py-4" onClick={() => setShowAI(true)}>
            📋 Ver template de IA
          </Btn>
          <div className="rounded-2xl bg-surface p-6 border border-border/40 focus-within:border-primary/40 transition-colors">
            <AutoTextArea
              value={data.description || ""}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Descrição detalhada..."
              className="text-[15px] leading-relaxed"
              minRows={8}
            />
          </div>
        </div>
      </section>

      {showAI && (
        <KitAITemplateModal 
          kit={kit} 
          market={market} 
          onClose={() => setShowAI(false)} 
        />
      )}
    </div>
  );
}

function KitAITemplateModal({ kit, market, onClose }: { kit: Kit; market: MK; onClose: () => void }) {
  const { updateKit } = useStore();
  const [copied, setCopied] = useState(false);
  const data = (kit as any)[market] || {};

  const generateDefault = () => `Kit: ${kit.name}\nComposição: ${kit.items.map(i => `${i.quantity}x ${i.productId}`).join(", ")}\nKeywords: ${kit.keywords.map(k => k.display).join(", ")}`;
  const [currentText, setCurrentText] = useState(data.aiTemplate || generateDefault());

  const save = () => {
    updateKit(kit.id, (k) => ({
      ...k,
      [market]: {
        ...((k as any)[market] || {}),
        aiTemplate: currentText,
      },
    }));
    toast.success("Template salvo!");
  };

  const copy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative bg-background border border-border w-full max-w-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-lg font-bold">Template de IA do Kit</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">
          <AutoTextArea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="w-full bg-surface/30 p-4 rounded-xl border border-border/40 text-sm font-mono"
            minRows={10}
          />
        </div>
        <div className="p-6 border-t border-border/40 flex justify-end gap-3">
          <Btn onClick={save} variant="soft">Salvar</Btn>
          <Btn onClick={copy} variant="primary">{copied ? "Copiado!" : "Copiar"}</Btn>
        </div>
      </div>
    </div>
  );
}
