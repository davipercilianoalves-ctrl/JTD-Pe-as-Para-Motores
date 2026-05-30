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
  Camera,
  ArrowLeft,
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

  function set<K extends keyof Product>(key: K, value: Product[K]) {
    updateProduct(product!.id, { [key]: value } as Partial<Product>);
  }

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
}

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
    updateProduct(product.id, (prev) => {
      const p = prev as Product;
      return {
        ...p,
        competitors: [...p.competitors, { 
          id: crypto.randomUUID(), 
          title: "", 
          link: "", 
          description: "", 
          notes: "", 
          keywordsFound: [], 
          marketplace: "mercadoLivre",
          updatedAt: Date.now(), 
          ...c 
        }]
      };
    });
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
      [market]: {
        ...p[market],
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
    const num = (v: any) => parseFloat(v) || 0;
    let safeValue = val;

    // Correction 6: Validation for percentages
    const percentFields: (keyof PricingData)[] = [
      "marketplaceFee", "shipping", "packaging", "transport", "tax", "fakeDiscountPercent"
    ];

    if (percentFields.includes(key)) {
      const typeKey = `${key}Type` as keyof PricingData;
      // If it's a value field AND its corresponding type is '%'
      if (p[typeKey] === "%" || key === "fakeDiscountPercent") {
        const parsed = num(val);
        safeValue = Math.max(0, Math.min(100, parsed));
      }
    }

    // Correction 3: desiredMargin validation
    if (key === "desiredMargin") {
      const parsed = num(val);
      safeValue = Math.max(0, Math.min(99, parsed));
    }

    updateProduct(product.id, (prev) => {
      const prod = prev as Product;
      return {
        ...prod,
        pricing: { ...(prod.pricing ?? emptyPricing()), [key]: safeValue }
      };
    });
  };

  return (
    <section className="space-y-6">
      <SectionTitle hint="Estrutura de precificação dinâmica para o marketplace.">
        Precificação
      </SectionTitle>
      
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border/40">
          <SubLabel>Modo de Cálculo</SubLabel>
          <select 
            value={p.calcMode} 
            onChange={(e) => setVal("calcMode", e.target.value)}
            className="w-full bg-transparent font-bold text-lg outline-none"
          >
            <option value="price">Definir Preço</option>
            <option value="profit">Definir Lucro R$</option>
            <option value="margin">Definir Margem %</option>
          </select>
        </div>

        {p.calcMode === "price" && (
          <div className="bg-surface p-5 rounded-2xl border border-border/40">
            <SubLabel>Preço de Venda</SubLabel>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold">R$</span>
              <input
                type="number"
                value={p.salePrice || ""}
                onChange={(e) => setVal("salePrice", e.target.value)}
                className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
                placeholder="0,00"
              />
            </div>
          </div>
        )}

        {p.calcMode === "profit" && (
          <div className="bg-surface p-5 rounded-2xl border border-border/40">
            <SubLabel>Lucro Desejado (R$)</SubLabel>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold">R$</span>
              <input
                type="number"
                value={p.desiredProfit || ""}
                onChange={(e) => setVal("desiredProfit", e.target.value)}
                className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
                placeholder="0,00"
              />
            </div>
          </div>
        )}

        {p.calcMode === "margin" && (
          <div className="bg-surface p-5 rounded-2xl border border-border/40">
            <SubLabel>Margem Desejada (%)</SubLabel>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={p.desiredMargin || ""}
                onChange={(e) => setVal("desiredMargin", e.target.value)}
                min={0}
                max={99}
                className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
                placeholder="0"
              />
              <span className="text-xl font-bold">%</span>
            </div>
          </div>
        )}

        <div className="bg-surface p-5 rounded-2xl border border-border/40">
          <SubLabel>Custo de Produto</SubLabel>
          <div className="flex items-center gap-1">
            <span className="text-xl font-semibold">R$</span>
            <input
              type="number"
              value={p.productCost || ""}
              onChange={(e) => setVal("productCost", e.target.value)}
              className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4">
          <div className="bg-surface p-6 rounded-2xl border border-border/40">
             <SectionTitle hint="Configure as taxas e custos variáveis.">Custos e Taxas</SectionTitle>
             <div className="space-y-4 mt-4">
                <PricingField label="Taxa Marketplace" value={p.marketplaceFee} type={p.marketplaceFeeType} onVal={(v) => setVal("marketplaceFee", v)} onType={(t) => setVal("marketplaceFeeType", t)} />
                <PricingField label="Frete / Envio" value={p.shipping} type={p.shippingType} onVal={(v) => setVal("shipping", v)} onType={(t) => setVal("shippingType", t)} />
                <PricingField label="Embalagem" value={p.packaging} type={p.packagingType} onVal={(v) => setVal("packaging", v)} onType={(t) => setVal("packagingType", t)} />
                <PricingField label="Imposto" value={p.tax} type={p.taxType} onVal={(v) => setVal("tax", v)} onType={(t) => setVal("taxType", t)} />
             </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border/40">
            <SectionTitle hint="Markup para exibir desconto falso no marketplace.">Markup de Desconto (Preço "De")</SectionTitle>
            <div className="flex items-center gap-4 mt-4">
               <div className="flex-1">
                  <SubLabel>Desconto Desejado (%)</SubLabel>
                  <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border/40">
                    <input 
                      type="number" 
                      min={0} 
                      max={100} 
                      value={p.fakeDiscountPercent || ""} 
                      onChange={(e) => setVal("fakeDiscountPercent", e.target.value)}
                      className="w-full bg-transparent font-bold outline-none"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
               </div>
            </div>
            {/* Correction 5: Falso desconto display */}
            {Number(p.fakeDiscountPercent) > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço "de" (com markup):</span>
                  <span className="font-semibold">{brl(result.displayedPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto aplicado:</span>
                  <span className="text-success font-semibold">- {brl(result.displayedPrice - result.finalPrice)}</span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-2 mt-1">
                  <span className="font-medium">Preço "por" (final):</span>
                  <span className="font-bold">{brl(result.finalPrice)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface p-6 rounded-2xl border border-border/40 h-full">
            <SectionTitle hint="Resultado final após descontar todos os custos.">Resultado Líquido</SectionTitle>
            
            <div className="mt-6 space-y-6">
              <div>
                <SubLabel>Preço de Venda Final</SubLabel>
                <div className="text-3xl font-bold">{brl(result.finalPrice)}</div>
              </div>

              {/* Correction 4: Mensagem explícita de prejuízo e Lucro */}
              <div>
                <SubLabel>Lucro por Unidade</SubLabel>
                {result.netProfit < 0 ? (
                  <div className="flex items-center gap-2 text-red-500 font-bold text-2xl">
                    <AlertTriangle className="h-6 w-6" />
                    <span>Prejuízo: {brl(Math.abs(result.netProfit))}</span>
                  </div>
                ) : (
                  <div className="text-success font-bold text-2xl">
                    Lucro: {brl(result.netProfit)}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/40">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Margem Líquida:</span>
                  <span className={cn(
                    "text-xl font-bold",
                    result.marginPct < 0 ? "text-red-500" : "text-success"
                  )}>
                    {result.marginPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/20 overflow-hidden bg-background/50">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b border-border/20">
                    <tr>
                      <th className="px-3 py-2 text-left">Breakdown</th>
                      <th className="px-3 py-2 text-right">R$</th>
                      <th className="px-3 py-2 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((b) => (
                      <tr key={b.label} className="border-b border-border/10 last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{b.label}</td>
                        <td className="px-3 py-2 text-right font-medium">{brl(b.amount)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{b.pctOfFinal.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingField({ 
  label, 
  value, 
  type, 
  onVal, 
  onType 
}: { 
  label: string; 
  value: number; 
  type: "R$" | "%"; 
  onVal: (v: any) => void; 
  onType: (t: "R$" | "%") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border/40">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onVal(e.target.value)}
          min={0}
          max={type === "%" ? 100 : undefined}
          className="w-20 bg-transparent text-right font-bold outline-none tabular-nums"
        />
        <button
          onClick={() => onType(type === "R$" ? "%" : "R$")}
          className="px-2 py-0.5 rounded bg-muted text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {type}
        </button>
      </div>
    </div>
  );
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) {
          h = (h / w) * MAX;
          w = MAX;
        } else {
          w = (w / h) * MAX;
          h = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = url;
  });
}

function ImagesSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetSlot, setTargetSlot] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const images = [...(product.images || [])].sort((a, b) => a.order - b.order);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetSlot === null) return;

    if (images.length >= 12) {
      toast.error("Limite de 12 imagens atingido");
      return;
    }

    const dataUrl = await compressImage(file);
    const newImage = {
      id: crypto.randomUUID(),
      dataUrl,
      order: targetSlot,
      isCover: images.length === 0,
    };

    updateProduct(product.id, (p) => {
      const currentImages = p.images || [];
      // If we are inserting into a slot that already exists or is "empty"
      // the instruction says "insert in the correct position (not always at the end)"
      // but if it's a grid of 12, we can just replace or push.
      // Re-ordering logic:
      const filtered = currentImages.filter(img => img.order !== targetSlot);
      return {
        ...p,
        images: [...filtered, newImage].sort((a, b) => a.order - b.order)
      };
    });

    setTargetSlot(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setCover = (id: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      images: p.images.map(img => ({
        ...img,
        isCover: img.id === id
      }))
    }));
  };

  const removeImage = async (id: string) => {
    if (await confirm({
      title: "Excluir esta imagem?",
      message: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      tone: "danger"
    })) {
      updateProduct(product.id, (p) => {
        const filtered = p.images
          .filter(img => img.id !== id)
          .map(img => ({ ...img }));
          
        const needsNewCover =
          filtered.length > 0 &&
          !filtered.some(img => img.isCover);
          
        const remaining = needsNewCover
          ? filtered.map((img, idx) => ({
              ...img,
              isCover: idx === 0 ? true : img.isCover,
            }))
          : filtered;
          
        return { ...p, images: remaining };
      });
    }
  };

  const downloadImage = (img: any, index: number) => {
    const a = document.createElement("a");
    a.href = img.dataUrl;
    a.download = `${product.name || "produto"}-${index + 1}.jpg`;
    a.click();
  };

  const move = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    updateProduct(product.id, (p) => {
      const newImages = p.images.map(img => ({ ...img }));
      // We need to find by array index since move() receives fromIdx and toIdx
      // but p.images might be sorted differently.
      // However, the 'images' variable in the outer scope is already sorted.
      // Let's ensure we are consistent.
      const sortedInState = [...p.images].sort((a, b) => a.order - b.order);
      const fromImgState = sortedInState[fromIdx];
      const toImgState = sortedInState[toIdx];

      if (fromImgState && toImgState) {
        // We find them in the newImages (which is the mutable-ish copy for state update)
        const fromImg = newImages.find(img => img.id === fromImgState.id);
        const toImg = newImages.find(img => img.id === toImgState.id);
        if (fromImg && toImg) {
          const tempOrder = fromImg.order;
          fromImg.order = toImg.order;
          toImg.order = tempOrder;
        }
      }
      return { ...p, images: newImages };
    });
  };

  const onDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) {
      setDragIdx(null);
      setDragOver(null);
      return;
    }
    
    updateProduct(product.id, (p) => {
      const newImages = p.images.map(img => ({ ...img }));
      const fromImg = newImages.find(img => img.order === dragIdx);
      const toImg = newImages.find(img => img.order === i);

      if (fromImg && toImg) {
        const tempOrder = fromImg.order;
        fromImg.order = toImg.order;
        toImg.order = tempOrder;
      } else if (fromImg && !toImg) {
        fromImg.order = i;
      }

      return { ...p, images: newImages };
    });
    setDragIdx(null);
    setDragOver(null);
  };

  const renderSlot = (i: number) => {
    const img = images.find(img => img.order === i);
    const isDragging = dragIdx === i;
    const isDragOver = dragOver === i;

    if (img) {
      const idxInArray = images.indexOf(img);
      return (
        <div 
          key={i}
          draggable={true}
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
          onDrop={() => onDrop(i)}
          onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
          className={cn(
            "group relative aspect-square rounded-xl overflow-hidden border border-border/40 bg-surface shadow-sm transition-all",
            isDragging && "opacity-40",
            isDragOver && "ring-2 ring-primary border-transparent"
          )}
        >
          <img src={img.dataUrl} className="h-full w-full object-cover" alt={`Imagem ${i + 1}`} />
          
          {img.isCover && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-primary text-[10px] font-bold text-white shadow-sm">
              Capa
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!img.isCover && (
              <button 
                onClick={() => setCover(img.id)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Definir como capa"
              >
                <Star className="h-4 w-4" />
              </button>
            )}
            <button 
              onClick={() => downloadImage(img, idxInArray)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={() => removeImage(img.id)}
              className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Move Buttons */}
          <div className="absolute bottom-1 left-1 right-1 flex justify-between md:hidden">
            <button 
              onClick={(e) => { e.stopPropagation(); move(idxInArray, idxInArray - 1); }}
              className="p-1 rounded bg-black/40 text-white disabled:opacity-30"
              disabled={idxInArray === 0}
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); move(idxInArray, idxInArray + 1); }}
              className="p-1 rounded bg-black/40 text-white disabled:opacity-30"
              disabled={idxInArray === images.length - 1}
            >
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <button 
        key={i}
        onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
        onDrop={() => onDrop(i)}
        onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
        onClick={() => {
          setTargetSlot(i);
          fileInputRef.current?.click();
        }}
        className={cn(
          "aspect-square rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-all bg-muted/30",
          isDragOver && "ring-2 ring-primary border-transparent bg-primary/5"
        )}
      >
        <Camera className="h-6 w-6 mb-1" />
        <span className="text-[10px] font-medium uppercase tracking-wider">Adicionar</span>
      </button>
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle hint="Gerencie até 12 imagens. A primeira é a capa.">
          Imagens do Produto
        </SectionTitle>
        <div className={cn(
          "text-xs font-bold",
          images.length > 10 ? "text-orange-500" : "text-muted-foreground"
        )}>
          {images.length} de 12 imagens
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => renderSlot(i))}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
      />
    </section>
  );
}

function VideosSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const confirm = useConfirm();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addVideo = () => {
    const newVideo: ProductVideo = {
      id: crypto.randomUUID(),
      name: "",
      script: "",
      speech: "",
      youtubeUrl: "",
      notes: "",
    };
    updateProduct(product.id, (p) => ({
      ...p,
      videos: [...(p.videos || []), newVideo],
    }));
    setExpandedId(newVideo.id);
  };

  const removeVideo = async (id: string) => {
    if (
      await confirm({
        title: "Excluir este vídeo?",
        message: "Esta ação não pode ser desfeita.",
        confirmLabel: "Excluir",
        tone: "danger",
      })
    ) {
      updateProduct(product.id, (p) => ({
        ...p,
        videos: p.videos.filter((v) => v.id !== id),
      }));
    }
  };

  const updateVideo = (id: string, data: Partial<ProductVideo>) => {
    updateProduct(product.id, (p) => ({
      ...p,
      videos: p.videos.map((v) => (v.id === id ? { ...v, ...data } : v)),
    }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, videoId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Vídeo muito grande. Limite: ${MAX_MB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateProduct(product.id, (p) => ({
        ...p,
        videos: p.videos.map((v) => (v.id === videoId ? { ...v, dataUrl } : v)),
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeVideoFile = async (videoId: string) => {
    if (
      await confirm({
        title: "Remover arquivo de vídeo?",
        message: "O arquivo será excluído, mas o roteiro e notas serão mantidos.",
        confirmLabel: "Remover",
        tone: "danger",
      })
    ) {
      updateVideo(videoId, { dataUrl: undefined });
    }
  };

  if (!product.videos?.length) {
    return (
      <section>
        <SectionTitle hint="Roteiros e referências de vídeo.">Vídeos</SectionTitle>
        <div className="p-12 text-center rounded-2xl border border-dashed border-border/60 bg-surface/30 text-muted-foreground flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Camera className="h-6 w-6 opacity-40" />
          </div>
          <p className="text-sm mb-6">Nenhum vídeo adicionado</p>
          <Btn onClick={addVideo} variant="primary">
            <Plus className="h-4 w-4 mr-2" /> Criar roteiro
          </Btn>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle hint="Roteiros e referências de vídeo.">Vídeos</SectionTitle>
        <Btn onClick={addVideo} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Adicionar vídeo
        </Btn>
      </div>

      <div className="space-y-4">
        {product.videos.map((video) => {
          const isExpanded = expandedId === video.id;
          const fileSizeMB = video.dataUrl
            ? ((Math.round(video.dataUrl.length * 0.75) / 1024) / 1024).toFixed(1)
            : "0";
          const isTooLarge = parseFloat(fileSizeMB) > 10;

          return (
            <div
              key={video.id}
              className={cn(
                "rounded-xl border border-border/40 bg-surface overflow-hidden transition-all",
                isExpanded && "ring-1 ring-primary/20 shadow-lg"
              )}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30" onClick={() => setExpandedId(isExpanded ? null : video.id)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Camera className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">{video.name || "Vídeo sem nome"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVideo(video.id);
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                </div>
              </div>

              {/* Card Content */}
              {isExpanded && (
                <div className="p-6 border-t border-border/40 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Nome do vídeo">
                      <TextInput
                        value={video.name}
                        onChange={(e) => updateVideo(video.id, { name: e.target.value })}
                        placeholder="Ex: Unboxing Filtro de Óleo Honda CG 150"
                      />
                    </Field>
                    <Field label="Link do YouTube">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <TextInput
                            value={video.youtubeUrl}
                            onChange={(e) => updateVideo(video.id, { youtubeUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            className="pl-9"
                          />
                        </div>
                        {video.youtubeUrl?.startsWith("https://") && (
                          <Btn variant="soft" onClick={() => window.open(video.youtubeUrl, "_blank")}>
                            Abrir
                          </Btn>
                        )}
                      </div>
                    </Field>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Roteiro (estrutura cena a cena)">
                      <AutoTextArea
                        value={video.script}
                        onChange={(e) => updateVideo(video.id, { script: e.target.value })}
                        placeholder="Estrutura do vídeo cena a cena...\nEx:\n0:00 - Abertura com produto na mão\n0:15 - Mostrar embalagem e código\n0:30 - Demonstração de encaixe"
                        minRows={4}
                      />
                    </Field>
                    <Field label="Falas (texto exato a ser falado)">
                      <AutoTextArea
                        value={video.speech}
                        onChange={(e) => updateVideo(video.id, { speech: e.target.value })}
                        placeholder="Texto exato a ser falado em cada cena..."
                        minRows={4}
                      />
                    </Field>
                  </div>

                  <div>
                    <SubLabel>Arquivo de Vídeo</SubLabel>
                    <div className="mt-2 p-4 rounded-xl border border-dashed border-border/60 bg-muted/20">
                      {!video.dataUrl ? (
                        <div className="space-y-4">
                          <label className="flex items-center justify-center gap-2 p-4 rounded-lg bg-surface border border-border/40 hover:bg-muted/50 cursor-pointer transition-colors text-sm font-medium">
                            <Upload className="h-4 w-4" />
                            📎 Anexar vídeo
                            <input
                              type="file"
                              className="hidden"
                              accept="video/mp4,video/webm,video/mov"
                              onChange={(e) => handleVideoUpload(e, video.id)}
                            />
                          </label>
                          <p className="text-[11px] text-muted-foreground text-center">
                            Vídeos grandes podem afetar o desempenho do app. Recomendamos usar o link do YouTube para vídeos longos.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <video src={video.dataUrl} controls preload="metadata" className="w-full rounded-lg shadow-sm bg-black" style={{ maxHeight: "300px" }} />
                          <div className="flex items-center justify-between">
                            <div className="text-xs">
                              <span className={cn("font-medium", isTooLarge ? "text-destructive" : "text-muted-foreground")}>
                                Arquivo: ~{fileSizeMB} MB
                              </span>
                              {isTooLarge && <span className="text-destructive ml-2">⚠ Arquivo grande — pode afetar o backup</span>}
                            </div>
                            <Btn size="sm" variant="soft" className="text-destructive hover:bg-destructive/10" onClick={() => removeVideoFile(video.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover vídeo
                            </Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Field label="Notas internas">
                    <AutoTextArea
                      value={video.notes}
                      onChange={(e) => updateVideo(video.id, { notes: e.target.value })}
                      placeholder="Ganchos, observações, ideias de edição..."
                      minRows={2}
                    />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
