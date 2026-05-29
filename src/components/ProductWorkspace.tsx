"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Star,
  Trash2,
  Copy,
  Check,
  Plus,
  Upload,
  Download,
  ExternalLink,
  ChevronDown,
  X,
  GripVertical,
  Cloud,
  RefreshCw,
  Save,
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Hash,
  DollarSign,
  Percent,
} from "lucide-react";
import { FloatingKeywordInput, FloatingKeywordCloud } from "./KeywordTools";
import { useStore, useSelectedProduct } from "@/lib/store";
import { useConfirm } from "@/components/ConfirmProvider";
import {
  parseSingleWords,
  parseKeywordTokens,
  canonKeyword,
  emptyPricing,
  type Product,
  type Keyword,
  type TitleVariant,
  type PricingData,
  type CompetitorBlock,
  type MarketplaceData,
  type MarketplaceId,
  type ProductVideo,
  type CostItem,
  type CostGroup,
  type CostKind,
} from "@/lib/types";
import {
  computePricing,
  simulateScenario,
  analyzePrice,
  brl,
  GROUP_LABELS,
  GROUP_ORDER,
  type Alert as PricingAlert,
  type PriceAnalysis,
  type PriceStatus,
  type BreakdownLine,
} from "@/lib/pricing";
import {
  Btn,
  Field,
  SectionTitle,
  TextInput,
  AutoTextArea,
} from "@/components/ui-kit";
import { CustomFieldsPanel } from "@/components/CustomFieldsPanel";
import { cn } from "@/lib/utils";
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

export function ProductWorkspace() {
  const product = useSelectedProduct();
  const { updateProduct, toggleFavorite, deleteProduct, goHome } = useStore();
  const confirm = useConfirm();
  const [market, setMarket] = useState<MK>("mercadoLivre");
  const [showMeta, setShowMeta] = useState(false);
  const [showCloud, setShowCloud] = useState(false);

  const allKeywords = useMemo(() => {
    if (!product) return [];
    const list: { text: string; source: string }[] = [];
    product.competitors.forEach((c) => {
      c.keywordsFound.forEach((kw) => list.push({ text: kw, source: c.title || "Concorrente" }));
    });
    return list;
  }, [product?.competitors]);

  if (!product) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center text-center px-10">
        <h2 className="text-2xl font-semibold">Nenhum produto selecionado</h2>
        <p className="text-base text-muted-foreground mt-3 max-w-md">
          Volte para o início para escolher ou criar um produto.
        </p>
        <button
          onClick={goHome}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Ir para o início
        </button>
      </div>
    );
  }

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    updateProduct(product.id, { [key]: value } as Partial<Product>);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1100px] px-12 pt-12 pb-32">
          <div className="flex items-start justify-between gap-6 mb-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Workspace
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCloud(true)}
                className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40"
              >
                <Cloud className="h-3.5 w-3.5" /> Ver todas as palavras
              </button>
              <button
                onClick={() => toggleFavorite(product.id)}
                className="rounded-lg p-2 hover:bg-accent"
                title="Favoritar"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    product.favorite ? "fill-warning text-warning" : "text-muted-foreground",
                  )}
                />
              </button>
              <button
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Excluir "${product.name || "este produto"}"?`,
                      message: "Esta ação remove o produto e tudo dentro dele. Não pode ser desfeita.",
                      confirmLabel: "Excluir produto",
                      tone: "danger",
                    })
                  )
                    deleteProduct(product.id);
                }}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <input
            value={product.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nome do produto"
            className="w-full bg-transparent text-5xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/30 mb-2"
          />
          <div className="text-xs text-muted-foreground">
            Atualizado {product.updatedAt > 0 ? new Date(product.updatedAt).toLocaleDateString("pt-BR") : "agora"} ·
            <span className="text-success ml-1">salvo automaticamente</span>
          </div>

          <div className="mt-12">
            <KeywordsSection product={product} />
          </div>

          <div className="mt-16">
            <CompetitorsSection product={product} />
          </div>

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
            <ConsolidatedKeywords product={product} />
            <TitlesSection product={product} market={market} />
            <DescriptionSection product={product} market={market} />
          </div>

          <div className="mt-16">
            <PricingSection product={product} />
          </div>

          <div className="mt-16">
            <ImagesSection product={product} />
          </div>

          <div className="mt-16">
            <VideosSection product={product} />
          </div>

          <div className="mt-20">
            <CustomFieldsPanel
              title="Campos do produto"
              hint="Um único motor de campos para o produto inteiro. Marque cada campo com os marketplaces onde ele aparece — ou deixe como Global. O filtro segue o marketplace selecionado acima."
              fields={product.customFields ?? []}
              onChange={(fields) => set("customFields", fields)}
              currentMarket={market}
            />
          </div>

          <div className="mt-20">
            <button
              onClick={() => setShowMeta((v) => !v)}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showMeta && "rotate-180")} />
              Informações do produto
            </button>
            {showMeta && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="SKU">
                  <TextInput value={product.sku} onChange={(e) => set("sku", e.target.value)} />
                </Field>
                <Field label="Código original">
                  <TextInput
                    value={product.originalCode}
                    onChange={(e) => set("originalCode", e.target.value)}
                  />
                </Field>
                <Field label="Marca">
                  <TextInput value={product.brand} onChange={(e) => set("brand", e.target.value)} />
                </Field>
                <Field label="Categoria">
                  <TextInput
                    value={product.category}
                    onChange={(e) => set("category", e.target.value)}
                  />
                </Field>
                <Field label="Fornecedor">
                  <TextInput
                    value={product.supplier}
                    onChange={(e) => set("supplier", e.target.value)}
                  />
                </Field>
                <Field label="Notas internas">
                  <AutoTextArea
                    value={product.internalNotes}
                    onChange={(e) => set("internalNotes", e.target.value)}
                    className="w-full bg-input/40 rounded-lg px-3.5 py-2.5 text-base outline-none focus:bg-input/70 transition-colors placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/40"
                    minRows={2}
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="mt-20">
            <SubLabel>Dúvidas frequentes (perguntas que aparecem em outros anúncios)</SubLabel>
            <AutoTextArea
              value={product.niche_faqs || ""}
              onChange={(e) => set("niche_faqs", e.target.value)}
              placeholder="Ex: Serve para modelo X? Tem garantia? Qual o prazo de entrega?"
              className="mt-2 w-full rounded-xl bg-surface px-5 py-4 text-[15px] border border-border/40 focus:border-primary/40 transition-colors outline-none"
              minRows={4}
            />
          </div>
        </div>
      </div>
      {showCloud && (
        <FloatingKeywordCloud
          keywords={allKeywords}
          onClose={() => setShowCloud(false)}
          productName={product.name}
        />
      )}
    </div>
  );
function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
      {children}
    </div>
  );
}


function ConsolidatedKeywords({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const allKeywords = useMemo(() => {
    return product.keywords.map(k => ({ text: k.display, source: "Lista Geral" }));
  }, [product.keywords]);

  return (
    <section>
      <SectionTitle hint="Palavras-chave consolidadas de todos os concorrentes e da sua lista master.">
        Nuvem de Palavras
      </SectionTitle>
      <div className="flex flex-wrap gap-2">
        {product.keywords.map((k) => (
          <span
            key={k.id}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              k.favorite ? "bg-warning/10 text-warning border border-warning/20" : "bg-muted text-muted-foreground border border-transparent"
            )}
          >
            {k.display}
          </span>
        ))}
        {product.keywords.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Nenhuma palavra-chave adicionada ainda.</p>
        )}
      </div>
    </section>
  );
}

function KeywordsSection({ product }: { product: Product }) {
  const { addKeywordTokens, removeKeyword, toggleKeywordFavorite } = useStore();
  const [draft, setDraft] = useState("");

  const commit = () => {
    const toks = parseKeywordTokens(draft);
    if (!toks.length) return;
    addKeywordTokens(product.id, toks);
    setDraft("");
  };

  return (
    <section>
      <SectionTitle hint="Palavras-chave principais para o SEO do seu anúncio.">
        Palavras-chave
      </SectionTitle>
      <div className="flex gap-2 mb-4">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Adicionar palavras (separe por vírgula ou Enter)..."
          onKeyDown={(e) => e.key === "Enter" && commit()}
        />
        <Btn onClick={commit} variant="primary">Adicionar</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {product.keywords.map((k) => (
          <div key={k.id} className="group flex items-center justify-between p-2 rounded-lg bg-surface border border-border/40 hover:border-primary/40 transition-colors">
            <span className="text-sm truncate">{k.display}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => toggleKeywordFavorite(product.id, k.id)} className={cn("p-1", k.favorite ? "text-warning" : "text-muted-foreground")}>
                <Star className="h-3.5 w-3.5" fill={k.favorite ? "currentColor" : "none"} />
              </button>
              <button onClick={() => removeKeyword(product.id, k.id)} className="p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompetitorsSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [showForm, setShowShowForm] = useState(false);

  const add = (c: Partial<CompetitorBlock>) => {
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: [...p.competitors, { 
        id: crypto.randomUUID(), 
        title: "", 
        link: "", 
        description: "", 
        notes: "", 
        keywordsFound: [], 
        marketplace: "mercadoLivre", // Required field
        updatedAt: Date.now(), 
        ...c 
      }]
    }));
  };

  const remove = (id: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: p.competitors.filter(c => c.id !== id)
    }));
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle hint="Analise seus principais concorrentes para extrair insights e palavras-chave.">
          Concorrentes
        </SectionTitle>
        <Btn size="sm" onClick={() => add({})}><Plus className="h-3.5 w-3.5 mr-1" /> Adicionar</Btn>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {product.competitors.map((c) => (
          <div key={c.id} className="p-4 rounded-xl bg-surface border border-border/40 relative group">
            <button onClick={() => remove(c.id)} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
            <input
              value={c.title}
              onChange={(e) => updateProduct(product.id, (p) => ({
                ...p,
                competitors: p.competitors.map(comp => comp.id === c.id ? { ...comp, title: e.target.value } : comp)
              }))}
              placeholder="Nome do concorrente / anúncio"
              className="w-full bg-transparent font-semibold outline-none placeholder:text-muted-foreground/30 mb-2"
            />
            <div className="flex items-center gap-2 mb-2">
              <input
                value={c.link}
                onChange={(e) => updateProduct(product.id, (p) => ({
                  ...p,
                  competitors: p.competitors.map(comp => comp.id === c.id ? { ...comp, link: e.target.value } : comp)
                }))}
                placeholder="Link do anúncio"
                className="flex-1 bg-input/40 rounded-lg px-2 py-1 text-xs outline-none"
              />
              {c.link && <a href={c.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>
            <AutoTextArea
              value={c.notes}
              onChange={(e) => updateProduct(product.id, (p) => ({
                ...p,
                competitors: p.competitors.map(comp => comp.id === c.id ? { ...comp, notes: e.target.value } : comp)
              }))}
              placeholder="Observações (estratégia, pontos fortes, etc)..."
              className="text-xs bg-input/20 p-2 rounded-lg"
              minRows={2}
            />
          </div>
        ))}
        {product.competitors.length === 0 && (
          <div className="col-span-full py-8 text-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
            Nenhum concorrente cadastrado.
          </div>
        )}
      </div>
    </section>
  );
}

function TitlesSection({ product, market }: { product: Product; market: MK }) {
  const { updateProduct } = useStore();
  const data = product[market];
  const [showKeywordBox, setShowKeywordBox] = useState(false);

  const limit = data.titleLimit ?? DEFAULT_LIMITS[market];
  const titles = (data.titles ?? []).length > 0 ? data.titles : [""];

  const upd = (idx: number, newValue: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: {
        ...p[market],
        titles: (p[market].titles ?? []).map((t, i) =>
          i === idx ? newValue.slice(0, limit) : t
        ),
      },
    }));
  };

  const setLimit = (val: number) => {
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: {
        ...p[market],
        titleLimit: val,
      },
    }));
  };

  const add = () => {
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: {
        ...p[market],
        titles: [...(p[market].titles ?? []), ""],
      },
    }));
  };

  const rm = (idx: number) => {
    updateProduct(product.id, (p) => {
      let nextTitles = (p[market].titles ?? []).filter((_, i) => i !== idx);
      if (nextTitles.length === 0) nextTitles = [""];
      return {
        ...p,
        [market]: {
          ...p[market],
          titles: nextTitles,
        },
      };
    });
  };

  const allKeywords = useMemo(() => {
    return product.keywords.map(k => ({ text: k.display, source: "Lista Geral" }));
  }, [product.keywords]);

  return (
    <section>
      <SectionTitle 
        hint="Crie múltiplos títulos. Use o box flutuante para ver palavras disponíveis."
        action={
          <button
            onClick={() => setShowKeywordBox(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Cloud className="h-3.5 w-3.5" /> ☁ Palavras disponíveis
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
        {titles.map((text, i) => (
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
          productName="Títulos"
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
  const count = value.length;
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
          placeholder="Digite o título do anúncio..."
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

function DescriptionSection({ product, market }: { product: Product; market: MK }) {
  const { updateProduct } = useStore();
  const data = product[market];
  const [showAI, setShowAI] = useState(false);

  const set = (patch: Partial<MarketplaceData>) => {
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: { ...p[market], ...patch }
    }));
  };

  return (
    <div className="space-y-12">
      <section>
        <SectionTitle hint="Uma ou duas frases resumindo o produto com as palavras-chave principais.">
          Breve descrição
        </SectionTitle>
        <div className="rounded-2xl bg-surface p-5 border border-border/40 focus-within:border-primary/40 transition-colors">
          <AutoTextArea
            value={data.shortDescription}
            onChange={(e) => set({ shortDescription: e.target.value })}
            placeholder="Resumo do produto..."
            className="text-[15px] leading-relaxed"
            minRows={3}
          />
        </div>
      </section>

      <section>
        <SectionTitle hint="Descrição detalhada do produto. Use o template para gerar com IA externa.">
          Descrição completa
        </SectionTitle>
        <div className="space-y-4">
          <Btn variant="soft" className="w-full py-4" onClick={() => setShowAI(true)}>
            📋 Gerar com IA externa
          </Btn>
          <div className="rounded-2xl bg-surface p-6 border border-border/40 focus-within:border-primary/40 transition-colors">
            <AutoTextArea
              value={data.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Cole aqui a descrição..."
              className="text-[15px] leading-relaxed"
              minRows={8}
            />
          </div>
        </div>
      </section>

      {showAI && (
        <AITemplateModal 
          product={product} 
          market={market} 
          onClose={() => setShowAI(false)} 
        />
      )}
    </div>
  );
}

function AITemplateModal({ product, market, onClose }: { product: Product; market: MK; onClose: () => void }) {
  const { updateProduct } = useStore();
  const [copied, setCopied] = useState(false);
  const data = product[market];
  const confirm = useConfirm();

  const generateDefault = () => `Produto: ${product.name}\nKeywords: ${product.keywords.map(k => k.display).join(", ")}`;
  const [currentText, setCurrentText] = useState(data.aiTemplate || generateDefault());

  const save = () => {
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: { ...p[market], aiTemplate: currentText }
    }));
    toast.success("Template salvo!");
  };

  const copy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative bg-background border border-border w-full max-w-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-lg font-bold">IA Template</h3>
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

function PricingSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const p = product.pricing ?? emptyPricing();

  const result = useMemo(() => computePricing(p), [p]);

  const setVal = (key: keyof PricingData, val: any) => {
    updateProduct(product.id, (prod) => ({
      ...prod,
      pricing: { ...(prod.pricing ?? emptyPricing()), [key]: val }
    }));
  };

  return (
    <section className="space-y-6">
      <SectionTitle hint="Estrutura de precificação dinâmica para o marketplace.">
        Precificação
      </SectionTitle>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border/40">
          <SubLabel>Preço de Venda</SubLabel>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">R$</span>
            <input
              type="number"
              value={p.salePrice || ""}
              onChange={(e) => setVal("salePrice", parseFloat(e.target.value) || 0)}
              className="text-4xl font-bold bg-transparent outline-none w-full tabular-nums"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border/40">
          <SubLabel>Lucro Líquido</SubLabel>
          <div className={cn("text-4xl font-bold tabular-nums", result.netProfit >= 0 ? "text-success" : "text-destructive")}>
            {brl(result.netProfit)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Margem: {result.marginPct.toFixed(1)}%</div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border/40">
          <SubLabel>Custo de Produto</SubLabel>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">R$</span>
            <input
              type="number"
              value={p.productCost || ""}
              onChange={(e) => setVal("productCost", parseFloat(e.target.value) || 0)}
              className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border/40">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-right">Valor R$</th>
              <th className="px-4 py-3 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown.map((b) => (
              <tr key={b.label} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{b.label}</td>
                <td className="px-4 py-3 text-right tabular-nums">{brl(b.amount)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{b.pctOfFinal.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ImagesSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  return (
    <section>
      <SectionTitle hint="Gerencie as imagens do produto.">Imagens</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {product.images.map((img) => (
          <div key={img.id} className="aspect-square rounded-xl bg-muted overflow-hidden relative border border-border/40 group">
            <img src={img.dataUrl} className="w-full h-full object-cover" />
            <button className="absolute top-1 right-1 p-1 bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button className="aspect-square rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
          <Upload className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-medium">Upload</span>
        </button>
      </div>
    </section>
  );
}

function VideosSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  return (
    <section>
      <SectionTitle hint="Roteiros e referências de vídeo.">Vídeos</SectionTitle>
      <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 text-muted-foreground">
        <Btn variant="soft"><Plus className="h-4 w-4 mr-2" /> Criar roteiro</Btn>
      </div>
    </section>
  );
}
