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
} from "lucide-react";
import { FloatingKeywordInput, FloatingKeywordCloud } from "./KeywordTools";
import { useStore, useSelectedProduct } from "@/lib/store";
import { useConfirm } from "@/components/ConfirmProvider";
import {
  parseSingleWords,
  parseKeywordTokens,
  canonKeyword,
  type Product,
  type Keyword,
  type TitleEntry,
  type TitleVariant,
  type PricingData,
  type CompetitorBlock,
  type MarketplaceData,
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


type MK = "mercadoLivre" | "shopee" | "amazon" | "tiktok";
const MARKETS: { key: MK; label: string }[] = [
  { key: "mercadoLivre", label: "Mercado Livre" },
  { key: "shopee", label: "Shopee" },
  { key: "amazon", label: "Amazon" },
  { key: "tiktok", label: "TikTok" },
];
const TITLE_VARIANTS: TitleVariant[] = ["SEO Forte", "Conversão", "Mobile", "Curto", "Completo"];

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
          {/* HEADER */}
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

          {/* 1 — KEYWORDS */}
          <div className="mt-12">
            <KeywordsSection product={product} />
          </div>

          {/* 2 — COMPETITORS */}
          <div className="mt-16">
            <CompetitorsSection product={product} />
          </div>

          {/* Marketplace switcher (applies to títulos + descrição) */}
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
            {/* 1. Consolidated Keywords */}
            <ConsolidatedKeywords product={product} />

            {/* 2. Titles */}
            <TitlesSection product={product} market={market} />

            {/* 3. Description (Short + Full) */}
            <DescriptionSection product={product} market={market} />
          </div>

          {/* 4 — PRICING */}
          <div className="mt-16">
            <PricingSection product={product} />
          </div>

          {/* 5 — IMAGES */}
          <div className="mt-16">
            <ImagesSection product={product} />
          </div>

          {/* 6 — VIDEOS */}
          <div className="mt-16">
            <VideosSection product={product} />
          </div>

          {/* 7 — CUSTOM FIELDS (one unified panel for the whole product) */}
          <div className="mt-20">
            <CustomFieldsPanel
              title="Campos do produto"
              hint="Um único motor de campos para o produto inteiro. Marque cada campo com os marketplaces onde ele aparece — ou deixe como Global. O filtro segue o marketplace selecionado acima."
              fields={product.customFields ?? []}
              onChange={(fields) => set("customFields", fields)}
              currentMarket={market}
            />
          </div>

          {/* META */}
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


          {/* 8 — FAQ */}
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

/* ============================================================
   1. KEYWORDS — vertical list + selected column for partial copy
============================================================ */
function KeywordsSection({ product }: { product: Product }) {
  const { addKeywordTokens, removeKeyword, toggleKeywordFavorite } = useStore();
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState<"all" | "sel" | null>(null);
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const commit = () => {
    const toks = parseKeywordTokens(draft);
    if (!toks.length) return;

    const currentList = product.keywords.map(k => k.display);
    const uniqueToks = toks.filter(word => {
      const normalized = word.trim().toLowerCase();
      const alreadyExists = currentList.some(
        k => k.trim().toLowerCase() === normalized
      );
      return !alreadyExists && normalized;
    });

    if (uniqueToks.length > 0) {
      addKeywordTokens(product.id, uniqueToks);
    }
    setDraft("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
  };

  const sorted = useMemo(() => {
    let list = filter === "fav" ? product.keywords.filter((k) => k.favorite) : product.keywords;
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((k) => k.text.includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.uses - a.uses;
    });
  }, [product.keywords, filter, query]);

  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(product.keywords.map((k) => k.id));
      const next = new Set<string>();
      prev.forEach((id) => valid.has(id) && next.add(id));
      return next.size === prev.size ? prev : next;
    });
  }, [product.keywords]);

  const selectedKws = product.keywords.filter((k) => selected.has(k.id));

  const toggleSel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(sorted.map((k) => k.display).join(", "));
    setCopied("all");
    setTimeout(() => setCopied(null), 1500);
  };
  const copySel = () => {
    if (!selectedKws.length) return;
    navigator.clipboard.writeText(selectedKws.map((k) => k.display).join(", "));
    setCopied("sel");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section>
      <SectionTitle
        hint="Lista mestre do produto. Use os checkboxes para copiar só o que importa."
        action={
          <span className="text-xs tabular-nums text-muted-foreground">
            {product.keywords.length} palavras
          </span>
        }
      >
        Palavras-chave
      </SectionTitle>

      <div className="rounded-2xl bg-surface overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={commit}
            placeholder="+ adicionar palavra (Enter ou vírgula)"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar..."
            className="w-32 bg-background/60 rounded-md px-2.5 py-1 text-xs outline-none placeholder:text-muted-foreground/40"
          />
          <div className="flex items-center gap-1 rounded-lg bg-background/60 p-0.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filter === "all" ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("fav")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filter === "fav" ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
            >
              <Star className="inline h-3 w-3 mr-1" /> Fav
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px]">
          <div className="max-h-[480px] overflow-auto py-2">
            {sorted.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground/70">
                Nenhuma palavra ainda. Adicione acima ou extraia da análise de concorrentes.
              </div>
            ) : (
              sorted.map((k) => {
                const isSel = selected.has(k.id);
                return (
                  <div
                    key={k.id}
                    className={cn(
                      "group flex items-center gap-3 pl-6 pr-4 py-2 hover:bg-surface-elevated transition-colors",
                      isSel && "bg-primary/5",
                    )}
                  >
                    <button
                      onClick={() => toggleSel(k.id)}
                      className={cn(
                        "shrink-0 h-4 w-4 rounded-[5px] border flex items-center justify-center transition-colors",
                        isSel
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/40 hover:border-foreground",
                      )}
                      title={isSel ? "Desmarcar" : "Selecionar"}
                    >
                      {isSel && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(k.display)}
                      className="flex-1 text-left text-[15px] leading-relaxed cursor-copy truncate"
                      title="Copiar"
                    >
                      {k.display}
                    </button>
                    <span className="tabular-nums text-xs text-muted-foreground/70 shrink-0 w-10 text-right">
                      ×{k.uses}
                    </span>
                    <button
                      onClick={() => toggleKeywordFavorite(product.id, k.id)}
                      className="shrink-0 p-1 opacity-50 hover:opacity-100"
                      title="Favoritar"
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5",
                          k.favorite && "fill-warning text-warning opacity-100",
                        )}
                      />
                    </button>
                    <button
                      onClick={() => removeKeyword(product.id, k.id)}
                      className="shrink-0 p-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground hover:text-destructive"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-border/60 bg-background/30 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Selecionadas
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {selectedKws.length}
              </span>
            </div>

            <div className="flex-1 min-h-[120px]">
              {selectedKws.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  Marque os checkboxes para montar uma seleção e copiar só essas palavras.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {selectedKws.map((k) => (
                    <div key={k.id} className="flex items-center gap-2 text-sm py-0.5 group/sel">
                      <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                      <span className="truncate flex-1">{k.display}</span>
                      <button
                        onClick={() => toggleSel(k.id)}
                        className="opacity-0 group-hover/sel:opacity-60 hover:!opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <Btn variant="primary" size="sm" onClick={copySel} disabled={!selectedKws.length}>
                {copied === "sel" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === "sel" ? "Copiado" : "Copiar selecionadas"}
              </Btn>
              <div className="flex gap-1.5">
                <Btn variant="soft" size="sm" onClick={copyAll} disabled={!sorted.length} className="flex-1">
                  {copied === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "all" ? "Copiado" : "Copiar tudo"}
                </Btn>
                {selectedKws.length > 0 && (
                  <Btn variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    Limpar
                  </Btn>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConsolidatedKeywords({ product }: { product: Product }) {
  const { removeKeyword } = useStore();
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(product.keywords.map((k) => k.display).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySelected = () => {
    const text = product.keywords
      .filter((k) => selected.has(k.id))
      .map((k) => k.display)
      .join(", ");
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <SectionTitle
        hint="Lista mestre consolidada de todas as palavras encontradas."
        action={
          <div className="flex gap-2">
            <Btn variant="soft" size="sm" onClick={copySelected} disabled={selected.size === 0}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copiar selecionadas
            </Btn>
            <Btn variant="soft" size="sm" onClick={copyAll} disabled={product.keywords.length === 0}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copiar todas
            </Btn>
          </div>
        }
      >
        Palavras-chave encontradas
      </SectionTitle>

      <div className="rounded-2xl bg-surface p-6">
        {product.keywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma palavra-chave adicionada ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {product.keywords.map((k) => {
              const isSelected = selected.has(k.id);
              return (
                <div
                  key={k.id}
                  onClick={() => toggleSelect(k.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background/40 border-border/60 hover:border-primary/40",
                  )}
                >
                  <span className="text-sm">{k.display}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKeyword(product.id, k.id);
                    }}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   2. COMPETITORS — fast inline blocks; keywords feed back into main list
============================================================ */
function CompetitorsSection({ product }: { product: Product }) {
  const { updateProduct, addKeywordTokens } = useStore();
  const confirm = useConfirm();
  const [openId, setOpenId] = useState<string | null>(null);

  const add = () => {
    const c: CompetitorBlock = {
      id: crypto.randomUUID(),
      link: "",
      title: "",
      description: "",
      notes: "",
      keywordsFound: [],
      marketplace: "Mercado Livre",
      updatedAt: Date.now(),
    };
    updateProduct(product.id, (p) => ({ ...p, competitors: [c, ...p.competitors] }));
    setOpenId(c.id);
  };
  const upd = (id: string, patch: Partial<CompetitorBlock>) =>
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: p.competitors.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
      ),
    }));
  const rm = (id: string) =>
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: p.competitors.filter((c) => c.id !== id),
    }));

  return (
    <section>
      <SectionTitle
        hint="O coração do app. Cole, observe, extraia palavras."
        action={
          <div className="flex items-center gap-2">
            <Btn variant="soft" size="sm" onClick={add}>
              <Plus className="h-3.5 w-3.5" /> Novo concorrente
            </Btn>
          </div>
        }
      >
        Análise de concorrentes
      </SectionTitle>

      {product.competitors.length === 0 ? (
        <div className="rounded-2xl bg-surface/60 py-12 text-center text-sm text-muted-foreground">
          Nenhum concorrente ainda. Adicione um para começar a extrair palavras.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {product.competitors.map((c) => {
            const open = openId === c.id;
            return (
              <div key={c.id} className="rounded-xl bg-surface overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-surface-elevated"
                  onClick={() => setOpenId(open ? null : c.id)}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {c.title || c.link || "Concorrente sem título"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {c.marketplace} · {c.keywordsFound.length} palavras extraídas
                    </div>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        await confirm({
                          title: "Excluir este concorrente?",
                          message: "A análise e as keywords extraídas dele serão removidas.",
                          confirmLabel: "Excluir",
                          tone: "danger",
                        })
                      )
                        rm(c.id);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {open && (
                  <div className="px-6 pb-6 pt-2 flex flex-col gap-5">
                    <div className="flex gap-2">
                      <input
                        value={c.link}
                        onChange={(e) => upd(c.id, { link: e.target.value })}
                        placeholder="Link do anúncio"
                        className="flex-1 bg-input/40 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-input/70"
                      />
                      <select
                        value={c.marketplace}
                        onChange={(e) => upd(c.id, { marketplace: e.target.value })}
                        className="rounded-lg bg-input/40 px-3 text-sm outline-none"
                      >
                        <option>Mercado Livre</option>
                        <option>Shopee</option>
                        <option>Amazon</option>
                        <option>TikTok Shop</option>
                      </select>
                      {c.link && (
                        <a
                          href={c.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-lg bg-accent px-3 hover:bg-accent/70"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    <input
                      value={c.title}
                      onChange={(e) => upd(c.id, { title: e.target.value })}
                      placeholder="Título do concorrente"
                      className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-muted-foreground/40"
                    />

                    <div>
                      <SubLabel>Descrição</SubLabel>
                      <AutoTextArea
                        value={c.description}
                        onChange={(e) => upd(c.id, { description: e.target.value })}
                        placeholder="Cole a descrição completa..."
                        minRows={4}
                        className="w-full bg-input/40 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-input/70 border-none transition-colors"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Preço (R$)">
                        <TextInput
                          value={c.price?.toString() || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const price = parseFloat(
                              value
                                .replace(/[^\d,.-]/g, "")
                                .replace(",", ".")
                            );
                            upd(c.id, { price: isNaN(price) ? undefined : price });
                          }}
                          placeholder="0,00"
                        />
                      </Field>
                    </div>

                    <CompetitorKeywords
                      block={c}
                      onChange={(words) => upd(c.id, { keywordsFound: words })}
                      onCommit={(words) => addKeywordTokens(product.id, words)}
                    />

                    <div>
                      <SubLabel>Notas internas</SubLabel>
                      <AutoTextArea
                        value={c.notes}
                        onChange={(e) => upd(c.id, { notes: e.target.value })}
                        placeholder="O que faz bem? O que dá pra superar?"
                        minRows={3}
                        className="w-full bg-input/40 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-input/70 border-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <PriceAnalysisSummary competitors={product.competitors} />
        </div>
      )}
    </section>
  );
}

function PriceAnalysisSummary({ competitors }: { competitors: CompetitorBlock[] }) {
  const valid = competitors
    .map(c => parseFloat(
      String(c.price ?? "").replace(",", ".")
    ))
    .filter(p => p > 0 && Number.isFinite(p));

  const min = valid.length > 0 ? Math.min(...valid) : null;
  const max = valid.length > 0 ? Math.max(...valid) : null;
  const avg = valid.length > 0
    ? valid.reduce((a, b) => a + b, 0) / valid.length
    : null;

  return (
    <div className={cn(
      "rounded-xl border px-6 py-5",
      valid.length > 0 ? "border-primary/20 bg-primary/5" : "border-border/40 bg-surface"
    )}>
      <div className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.18em] mb-4",
        valid.length > 0 ? "text-primary/80" : "text-muted-foreground"
      )}>
        Análise de Preços dos Concorrentes
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Mínimo</div>
          <div className="text-lg font-medium">{min !== null ? brl(min) : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Máximo</div>
          <div className="text-lg font-medium">{max !== null ? brl(max) : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Médio</div>
          <div className="text-lg font-medium text-primary">{avg !== null ? brl(avg) : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Base</div>
          <div className="text-lg font-medium">{valid.length} {valid.length === 1 ? 'anúncio' : 'anúncios'}</div>
        </div>
      </div>
    </div>
  );
}

function CompetitorKeywords({
  block,
  onChange,
  onCommit,
}: {
  block: CompetitorBlock;
  onChange: (words: string[]) => void;
  onCommit: (words: string[]) => void;
}) {
  const [flash, setFlash] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const flashOk = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 700);
  };

  const addWord = (word: string) => {
    const normalized = word.trim().toLowerCase();
    const currentList = block.keywordsFound;
    const alreadyExists = currentList.some(
      k => k.trim().toLowerCase() === normalized
    );
    
    if (!alreadyExists && normalized) {
      onChange([...block.keywordsFound, word]);
      onCommit([word]);
      flashOk();
    }
  };

  const removeWord = (word: string) => {
    onChange(block.keywordsFound.filter((w) => w !== word));
  };

  const resendAll = () => {
    if (!block.keywordsFound.length) return;
    onCommit(block.keywordsFound);
    flashOk();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SubLabel>
          <span className="inline-flex items-center gap-2">
            Palavras-chave encontradas
            {flash && (
              <span className="normal-case tracking-normal text-success text-[11px] inline-flex items-center gap-1">
                <Check className="h-3 w-3" /> enviado
              </span>
            )}
          </span>
        </SubLabel>
        <div className="flex items-center gap-3">
          <button
            ref={btnRef}
            onClick={() => setShowInput(true)}
            className="text-[11px] text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Palavras-chave
          </button>
          <button
            onClick={resendAll}
            disabled={!block.keywordsFound.length}
            className="text-[11px] text-primary hover:underline disabled:opacity-30"
          >
            Enviar todas →
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 min-h-[40px]">
        {block.keywordsFound.length === 0 ? (
          <span className="text-xs text-muted-foreground/50">Nenhuma palavra adicionada.</span>
        ) : (
          block.keywordsFound.map((w, i) => (
            <span
              key={i}
              className="group inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs"
            >
              {w}
              <button
                onClick={() => removeWord(w)}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {showInput && btnRef.current && (
        <FloatingKeywordInput
          initialKeywords={block.keywordsFound}
          onAdd={addWord}
          onRemove={removeWord}
          onClose={() => setShowInput(false)}
          position={{
            top: (btnRef.current?.getBoundingClientRect().bottom ?? 0) + (typeof window !== "undefined" ? window.scrollY : 0) + 5,
            left: (btnRef.current?.getBoundingClientRect().left ?? 0) + (typeof window !== "undefined" ? window.scrollX : 0) - 200,
          }}
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

/* ============================================================
   3a. TITLES — multiple variants with floating keyword box
============================================================ */
function TitlesSection({ product, market }: { product: Product; market: MK }) {
  const { updateProduct } = useStore();
  const data = product[market];
  const [showKeywordBox, setShowKeywordBox] = useState(false);

  const titles = data.titles && data.titles.length > 0 ? data.titles : [""];

  const upd = (idx: number, text: string) => {
    updateProduct(product.id, (p) => {
      const nextTitles = [...(p[market].titles || [""])];
      nextTitles[idx] = text.slice(0, 60);
      return { ...p, [market]: { ...p[market], titles: nextTitles } };
    });
  };

  const add = () => {
    updateProduct(product.id, (p) => {
      const nextTitles = [...(p[market].titles || [""]), ""];
      return { ...p, [market]: { ...p[market], titles: nextTitles } };
    });
  };

  const rm = (idx: number) => {
    updateProduct(product.id, (p) => {
      let nextTitles = (p[market].titles || [""]).filter((_, i) => i !== idx);
      if (nextTitles.length === 0) nextTitles = [""];
      return { ...p, [market]: { ...p[market], titles: nextTitles } };
    });
  };

  const usedWords = useMemo(() => {
    return new Set(
      titles
        .join(" ")
        .toLowerCase()
        .split(/[\s,\n]+/)
        .filter(Boolean)
    );
  }, [titles]);

  const isUsed = (word: string) => usedWords.has(word.toLowerCase().trim());

  const copyUnused = () => {
    const unused = product.keywords
      .map((k) => k.display)
      .filter((w) => !isUsed(w));
    if (unused.length > 0) {
      navigator.clipboard.writeText(unused.join(", "));
    }
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

      <div className="flex flex-col gap-4">
        {titles.map((text, i) => (
          <TitleField
            key={i}
            value={text}
            onChange={(val) => upd(i, val)}
            onRemove={() => rm(i)}
            autoFocus={i === titles.length - 1 && i > 0 && !text}
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
          checkUsed={isUsed}
          onCopyUnused={copyUnused}
        />
      )}
    </section>
  );
}

function TitleField({ 
  value, 
  onChange, 
  onRemove,
  autoFocus
}: { 
  value: string; 
  onChange: (v: string) => void; 
  onRemove: () => void;
  autoFocus?: boolean;
}) {
  const len = value.length;
  const isRed = len === 60;
  const isYellow = len > 55 && len < 60;

  return (
    <div className="group relative">
      <div className={cn(
        "flex items-center gap-3 bg-surface px-5 py-3.5 rounded-xl border transition-all",
        isRed ? "border-destructive ring-1 ring-destructive/20" : "border-border/40 focus-within:border-primary/40"
      )}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o título do anúncio..."
          maxLength={60}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-muted-foreground/30"
        />
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-[11px] font-bold tabular-nums tracking-wider",
            isRed ? "text-destructive" : isYellow ? "text-warning" : "text-muted-foreground/40"
          )}>
            {len}/60
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

  const usedKeywordsCount = useMemo(() => {
    const text = (data.shortDescription || "").toLowerCase();
    return product.keywords.filter(k => text.includes(k.text)).length;
  }, [data.shortDescription, product.keywords]);

  return (
    <div className="space-y-12">
      {/* Short Description */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle hint="Uma ou duas frases resumindo o produto com as palavras-chave principais.">
            Breve descrição
          </SectionTitle>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-surface px-2.5 py-1 rounded-full border border-border/40">
            {usedKeywordsCount} de {product.keywords.length} palavras-chave usadas
          </span>
        </div>
        <div className="rounded-2xl bg-surface p-5 border border-border/40 focus-within:border-primary/40 transition-colors">
          <AutoTextArea
            value={data.shortDescription}
            onChange={(e) => set({ shortDescription: e.target.value })}
            placeholder="Uma ou duas frases que resumem o produto incluindo as palavras-chave principais..."
            className="text-[15px] leading-relaxed"
            minRows={3}
          />
        </div>
      </section>

      <div className="h-px bg-border/40" />

      {/* Full Description */}
      <section>
        <SectionTitle hint="Descrição detalhada do produto. Use o template para gerar com IA externa.">
          Descrição completa
        </SectionTitle>
        <div className="space-y-4">
          <Btn 
            variant="soft" 
            className="w-full py-4 text-primary font-bold shadow-sm"
            onClick={() => setShowAI(true)}
          >
            <Copy className="h-4 w-4 mr-2" /> 📋 Gerar com IA externa
          </Btn>
          <div className="rounded-2xl bg-surface p-6 border border-border/40 focus-within:border-primary/40 transition-colors">
            <AutoTextArea
              value={data.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Cole aqui a descrição completa gerada pela IA..."
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

function AITemplateModal({ 
  product, 
  market, 
  onClose 
}: { 
  product: Product; 
  market: MK; 
  onClose: () => void 
}) {
  const [copied, setCopied] = useState(false);
  const data = product[market];

  const marketRange = useMemo(() => {
    const prices = product.competitors.map(c => c.price).filter((p): p is number => !!p && p > 0);
    if (prices.length === 0) return "N/A";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `${min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} a ${max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  }, [product.competitors]);

  const template = `Você é um especialista em copywriting para marketplace.
Crie uma descrição completa para o seguinte produto:

Produto: ${product.name}
Breve descrição: ${data.shortDescription}
Palavras-chave obrigatórias: ${product.keywords.map(k => k.display).join(", ")}
Faixa de preço do mercado: ${marketRange} (baseado na análise de concorrentes)

A descrição deve:
- Ter entre 300 e 500 palavras
- Usar todas as palavras-chave de forma natural
- Responder as principais dúvidas do comprador
- Ter um parágrafo inicial de impacto
- Listar benefícios e especificações técnicas
- Terminar com chamada para ação
- Tom: direto, confiante e informativo`;

  const copy = () => {
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border w-full max-w-[700px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-surface/30">
          <div>
            <h3 className="text-lg font-bold">Template para IA externa</h3>
            <p className="text-xs text-muted-foreground">Copie este prompt e cole no ChatGPT ou Claude</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-background">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-surface p-5 rounded-xl border border-border/40 text-foreground/80">
            {template}
          </pre>
        </div>

        <div className="p-6 border-t border-border/40 bg-surface/30 flex items-center justify-end gap-3">
          <Btn variant="ghost" onClick={onClose}>Fechar</Btn>
          <Btn variant="primary" onClick={copy} className="min-w-[140px]">
            {copied ? (
              <><Check className="h-4 w-4 mr-2" /> Copiado!</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" /> Copiar template</>
            )}
          </Btn>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   4. PRICING — strategic cockpit
============================================================ */


function PricingSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const p = product.pricing;

  const patch = (patchFn: (prev: typeof p) => typeof p) =>
    updateProduct(product.id, (prod) => ({ ...prod, pricing: patchFn(prod.pricing) }));

  const setItem = (id: string, change: Partial<CostItem>) =>
    patch((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...change } : it)),
    }));
  const removeItem = (id: string) =>
    patch((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
  const addItem = (group: CostGroup) =>
    patch((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          label: "Novo custo",
          kind: "currency",
          value: 0,
          group,
        },
      ],
    }));

  const result = useMemo(() => computePricing(p), [p]);


  const priceAnalyses: { key: string; label: string; pa: PriceAnalysis }[] = useMemo(
    () => [
      { key: "ideal", label: "Preço ideal", pa: analyzePrice(p, result.idealPrice, "ideal") },
      { key: "psych", label: "Psicológico", pa: analyzePrice(p, result.psychological, "psych") },
      { key: "min", label: "Mínimo seguro", pa: analyzePrice(p, result.minSafePrice, "min") },
      { key: "aggressive", label: "Agressivo", pa: analyzePrice(p, result.aggressivePrice, "aggressive") },
    ],
    [p, result.idealPrice, result.psychological, result.minSafePrice, result.aggressivePrice],
  );

  return (
    <section className="space-y-5">
      <SectionTitle hint="Cockpit estratégico — entenda exatamente para onde vai cada real e quanta margem você tem para jogar.">
        Precificação
      </SectionTitle>

      {/* HERO — preço final massivo + slider de desconto */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-7">
        <div className="grid lg:grid-cols-[1.4fr_1fr_1fr] gap-8 items-end">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Preço final cobrado
            </div>
            <div className="text-6xl font-semibold tabular-nums tracking-tight leading-none">
              {brl(result.finalPrice)}
            </div>
            {p.visibleDiscount > 0 && p.compensateDiscount && (
              <div className="mt-2 text-sm text-muted-foreground">
                De{" "}
                <span className="line-through tabular-nums">
                  {brl(result.displayedPrice)}
                </span>{" "}
                por{" "}
                <span className="text-foreground font-medium tabular-nums">
                  {brl(result.finalPrice)}
                </span>{" "}
                ({p.visibleDiscount}% OFF — lucro preservado)
              </div>
            )}
            {p.visibleDiscount > 0 && !p.compensateDiscount && (
              <div className="mt-2 text-sm text-muted-foreground">
                Desconto sai do seu lucro.
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Lucro líquido
            </div>
            <div
              className={cn(
                "text-4xl font-semibold tabular-nums tracking-tight leading-none",
                result.netProfit >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {brl(result.netProfit)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Margem real
            </div>
            <div
              className={cn(
                "text-4xl font-semibold tabular-nums tracking-tight leading-none",
                result.marginPct >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {result.marginPct.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Slider desconto */}
        <div className="mt-7 pt-6 border-t border-border/50 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Mostrar desconto
              </div>
              <div className="text-lg font-semibold tabular-nums">
                {p.visibleDiscount}% OFF
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(50, p.maxDiscount)}
              step={1}
              value={p.visibleDiscount}
              onChange={(e) =>
                patch((prev) => ({ ...prev, visibleDiscount: +e.target.value }))
              }
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>0%</span>
              <span>
                Limite seguro:{" "}
                <input
                  type="number"
                  value={p.maxDiscount}
                  onChange={(e) =>
                    patch((prev) => ({ ...prev, maxDiscount: +e.target.value || 0 }))
                  }
                  className="w-12 bg-transparent text-foreground tabular-nums outline-none border-b border-border focus:border-primary"
                />
                %
              </span>
              <span>{Math.max(50, p.maxDiscount)}%</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={p.compensateDiscount}
              onChange={(e) =>
                patch((prev) => ({ ...prev, compensateDiscount: e.target.checked }))
              }
              className="accent-primary w-4 h-4"
            />
            Compensar no preço de
            <span className="text-muted-foreground">(lucro intacto)</span>
          </label>
        </div>
      </div>

      {/* LINHA: custos | 4 cards de análise */}
      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
        {/* CUSTOS */}
        <div className="rounded-2xl bg-surface p-5 space-y-5">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80 mb-2">
              Quanto de lucro você quer ter?
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={p.desiredProfit || ""}
                onChange={(e) =>
                  patch((prev) => ({ ...prev, desiredProfit: +e.target.value || 0 }))
                }
                className="w-full bg-transparent outline-none text-3xl font-semibold tabular-nums tracking-tight"
                placeholder="0"
              />
              <KindToggle
                kind={p.desiredProfitKind}
                onChange={(k) =>
                  patch((prev) => ({ ...prev, desiredProfitKind: k }))
                }
              />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {p.desiredProfitKind === "percent"
                ? "% sobre cada venda."
                : "valor fixo por venda."}
            </div>
          </div>

          {GROUP_ORDER.map((group) => {
            const items = p.items.filter((it) => it.group === group);
            return (
              <div key={group}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {GROUP_LABELS[group]}
                  </div>
                  <button
                    onClick={() => addItem(group as CostGroup)}
                    className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> adicionar
                  </button>
                </div>
                <div className="space-y-1.5">
                  {items.length === 0 && (
                    <div className="text-[11px] text-muted-foreground/60 italic px-2 py-1">
                      vazio
                    </div>
                  )}
                  {items.map((it) => (
                    <CostRow
                      key={it.id}
                      item={it}
                      onChange={(c) => setItem(it.id, c)}
                      onRemove={() => removeItem(it.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* PREÇOS RECOMENDADOS — hierarquia: ideal em destaque + 3 alternativas */}
        <div className="rounded-2xl bg-surface p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Preços recomendados
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Compare quatro estratégias antes de decidir. O destaque é o seu alvo; os demais mostram seus limites.
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.25fr_minmax(0,1fr)] gap-4">
            {(() => {
              const ideal = priceAnalyses.find((x) => x.key === "ideal")!;
              const others = priceAnalyses.filter((x) => x.key !== "ideal");
              return (
                <>
                  <PriceAnalysisCard label={ideal.label} pa={ideal.pa} featured />
                  <div className="grid gap-2.5">
                    {others.map(({ key, label, pa }) => (
                      <PriceAnalysisCard key={key} label={label} pa={pa} compact />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* PRA ONDE VAI O DINHEIRO + ALERTAS */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="rounded-2xl bg-surface p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-4">
            Pra onde vai seu dinheiro
          </div>
          <div className="space-y-2.5">
            {result.breakdown
              .filter((b) => b.amount > 0)
              .sort((a, b) => b.amount - a.amount)
              .map((b) => (
                <div key={b.item.id}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-muted-foreground truncate">
                      {b.item.label}
                    </span>
                    <span className="tabular-nums">
                      {brl(b.amount)}{" "}
                      <span className="text-muted-foreground">
                        ({b.pctOfFinal.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-background/80 overflow-hidden">
                    <div
                      className="h-full bg-primary/60"
                      style={{
                        width: `${Math.min(100, Math.max(0, b.pctOfFinal))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            {result.breakdown.every((b) => b.amount === 0) && (
              <div className="text-xs text-muted-foreground/70 italic">
                preencha os custos para ver o fluxo do dinheiro
              </div>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-border/50 space-y-1.5 text-sm leading-relaxed">
            <p className="text-muted-foreground">
              Custo base:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {brl(result.baseCost)}
              </span>{" "}
              · Taxas %:{" "}
              <span className="text-foreground font-medium">
                {(result.feesPct * 100).toFixed(1)}%
              </span>
            </p>
            <p
              className={cn(
                result.netProfit >= 0 ? "text-success" : "text-destructive",
              )}
            >
              Você fica com{" "}
              <span className="font-semibold tabular-nums">
                {brl(result.netProfit)}
              </span>{" "}
              ({result.marginPct.toFixed(1)}%) depois de tudo.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">
            Alertas estratégicos
          </div>
          {result.alerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted-foreground text-center">
              Nada para alertar agora.
            </div>
          ) : (
            result.alerts.map((a) => <AlertCard key={a.id} alert={a} />)
          )}
        </div>
      </div>

      {/* SIMULADOR DE CENÁRIOS */}
      <div className="rounded-2xl bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Simulador de cenários
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              Veja como cada nível de desconto impacta seu lucro real.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {p.scenarios.map((pct) => {
            const r = simulateScenario(p, pct);
            const tone =
              r.netProfit < 0 ? "danger" : r.marginPct < 10 ? "warning" : "success";
            return (
              <button
                key={pct}
                onClick={() => patch((prev) => ({ ...prev, visibleDiscount: pct }))}
                className={cn(
                  "text-left rounded-xl border p-4 transition-colors hover:bg-accent/40",
                  tone === "danger" && "border-destructive/40",
                  tone === "warning" && "border-warning/40",
                  tone === "success" && "border-success/40",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {pct}% OFF
                  </span>
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      tone === "danger" && "bg-destructive",
                      tone === "warning" && "bg-warning",
                      tone === "success" && "bg-success",
                    )}
                  />
                </div>
                <div className="text-xl font-semibold tabular-nums">
                  {brl(r.finalPrice)}
                </div>
                {p.compensateDiscount && (
                  <div className="text-[11px] text-muted-foreground line-through tabular-nums">
                    {brl(r.displayedPrice)}
                  </div>
                )}
                <div className="mt-2 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Lucro</span>
                  <span
                    className={cn(
                      "tabular-nums font-medium",
                      r.netProfit >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {brl(r.netProfit)}
                  </span>
                </div>
                <div className="text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Margem</span>
                  <span className="tabular-nums">
                    {r.marginPct.toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PriceAnalysisCard({
  label,
  pa,
  featured,
  compact,
}: {
  label: string;
  pa: PriceAnalysis;
  featured?: boolean;
  compact?: boolean;
}) {
  const toneByStatus: Record<
    PriceStatus,
    { ring: string; dot: string; text: string; soft: string }
  > = {
    healthy: {
      ring: "border-success/40",
      dot: "bg-success",
      text: "Saudável",
      soft: "bg-success/10",
    },
    attention: {
      ring: "border-warning/40",
      dot: "bg-warning",
      text: "Atenção",
      soft: "bg-warning/10",
    },
    risk: {
      ring: "border-warning/50",
      dot: "bg-warning",
      text: "Risco",
      soft: "bg-warning/10",
    },
    loss: {
      ring: "border-destructive/50",
      dot: "bg-destructive",
      text: "Prejuízo",
      soft: "bg-destructive/10",
    },
  };
  const tone = toneByStatus[pa.status];

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl border bg-background/40 p-3 flex items-center gap-3",
          tone.ring,
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className={cn("w-1.5 h-1.5 rounded-full", tone.dot)} />
            {label}
          </div>
          <div className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight leading-tight">
            {brl(pa.price)}
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">
            {pa.reason}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div
            className={cn(
              "text-sm font-semibold tabular-nums",
              pa.netProfit >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {brl(pa.netProfit)}
          </div>
          <div
            className={cn(
              "text-[11px] tabular-nums",
              pa.marginPct >= 0 ? "text-success/80" : "text-destructive/80",
            )}
          >
            {pa.marginPct.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        tone.ring,
        featured
          ? "bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent ring-1 ring-primary/30"
          : "bg-surface",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          {featured && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">
              Recomendado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className={cn("w-1.5 h-1.5 rounded-full", tone.dot)} />
          {tone.text}
        </div>
      </div>
      <div
        className={cn(
          "font-semibold tabular-nums tracking-tight leading-none",
          featured ? "text-4xl" : "text-3xl",
        )}
      >
        {brl(pa.price)}
      </div>
      <div className="mt-3 flex items-baseline gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Lucro </span>
          <span
            className={cn(
              "tabular-nums font-medium",
              pa.netProfit >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {brl(pa.netProfit)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Margem </span>
          <span
            className={cn(
              "tabular-nums font-medium",
              pa.marginPct >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {pa.marginPct.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {pa.reason}
      </p>
    </div>
  );
}

function CostRow({
  item,
  onChange,
  onRemove,
}: {
  item: CostItem;
  onChange: (c: Partial<CostItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-1.5 rounded-lg bg-input/40 px-2 py-1.5 hover:bg-input/60 transition-colors">
      <input
        value={item.label}
        onChange={(e) => onChange({ label: e.target.value })}
        className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50 min-w-0"
        placeholder="Nome do custo"
      />
      <input
        type="number"
        step="0.01"
        value={item.value || ""}
        onChange={(e) => onChange({ value: +e.target.value || 0 })}
        placeholder="0"
        className="w-16 bg-transparent outline-none tabular-nums text-[13px] text-right"
      />
      <KindToggle
        kind={item.kind}
        onChange={(k) =>
          onChange({
            kind: k,
            base: k === "percent" ? item.base ?? "final" : undefined,
          })
        }
      />
      {item.kind === "percent" && (
        <button
          onClick={() =>
            onChange({ base: item.base === "cost" ? "final" : "cost" })
          }
          title={item.base === "cost" ? "% sobre o custo" : "% sobre o preço final"}
          className="text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground px-1"
        >
          {item.base === "cost" ? "/c" : "/p"}
        </button>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function KindToggle({
  kind,
  onChange,
}: {
  kind: CostKind;
  onChange: (k: CostKind) => void;
}) {
  return (
    <button
      onClick={() => onChange(kind === "currency" ? "percent" : "currency")}
      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground hover:text-foreground tabular-nums"
      title="Alternar R$ / %"
    >
      {kind === "currency" ? "R$" : "%"}
    </button>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-lg font-semibold tabular-nums tracking-tight",
          accent && "text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: PricingAlert }) {
  const tones = {
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
    warning: "border-warning/40 bg-warning/10 text-warning",
    success: "border-success/40 bg-success/10 text-success",
    info: "border-border bg-surface text-foreground",
  } as const;
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", tones[alert.tone])}>
      <div className="font-semibold">{alert.title}</div>
      {alert.detail && (
        <div className="text-xs opacity-80 mt-0.5">{alert.detail}</div>
      )}
    </div>
  );
}


/* ============================================================
   5. IMAGES — large gallery, drag-reorder, main image, lightbox
============================================================ */
function ImagesSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const dragIdx = useRef<number | null>(null);

  const ingest = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newImgs = await Promise.all(
      arr.map(
        (f) =>
          new Promise<{
            id: string;
            dataUrl: string;
            name: string;
            favorite: boolean;
            isMain: boolean;
            notes: string;
          }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                dataUrl: reader.result as string,
                name: f.name,
                favorite: false,
                isMain: false,
                notes: "",
              });
            reader.readAsDataURL(f);
          }),
      ),
    );
    updateProduct(product.id, (p) => {
      const combined = [...p.images, ...newImgs];
      if (!combined.some((i) => i.isMain) && combined[0]) {
        combined[0] = { ...combined[0], isMain: true };
      }
      return { ...p, images: combined };
    });
  };

  const setMain = (id: string) =>
    updateProduct(product.id, (p) => ({
      ...p,
      images: p.images.map((x) => ({ ...x, isMain: x.id === id })),
    }));

  const remove = (id: string) =>
    updateProduct(product.id, (p) => {
      const filtered = p.images.filter((x) => x.id !== id);
      if (!filtered.some((i) => i.isMain) && filtered[0]) {
        filtered[0] = { ...filtered[0], isMain: true };
      }
      return { ...p, images: filtered };
    });

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    updateProduct(product.id, (p) => {
      const arr = [...p.images];
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return { ...p, images: arr };
    });
  };

  return (
    <section>
      <SectionTitle
        hint={`${product.images.length} imagem(ns) · arraste para reordenar`}
        action={
          <Btn variant="soft" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Enviar
          </Btn>
        }
      >
        Imagens
      </SectionTitle>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && ingest(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) ingest(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl transition-colors",
          drag ? "bg-primary/10 ring-2 ring-primary/40" : "bg-surface",
        )}
      >
        {product.images.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-24 text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="mx-auto h-8 w-8 mb-3" />
            <div className="text-base font-medium">Arraste imagens ou clique para enviar</div>
          </button>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5">
            {product.images.map((img, idx) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => (dragIdx.current = idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIdx.current !== null) reorder(dragIdx.current, idx);
                  dragIdx.current = null;
                }}
                className="group relative overflow-hidden rounded-xl bg-background aspect-square"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="h-full w-full object-cover cursor-zoom-in"
                  onClick={() => setLightbox(img.dataUrl)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {img.isMain && (
                  <span className="absolute top-2 left-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground uppercase tracking-wider">
                    Principal
                  </span>
                )}

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconChip onClick={() => setMain(img.id)} title="Definir como principal">
                    <Star
                      className={cn(
                        "h-3.5 w-3.5 text-white",
                        img.isMain && "fill-warning text-warning",
                      )}
                    />
                  </IconChip>
                  <IconChip as="a" href={img.dataUrl} download={img.name}>
                    <Download className="h-3.5 w-3.5 text-white" />
                  </IconChip>
                  <IconChip onClick={() => remove(img.id)} title="Excluir">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </IconChip>
                </div>

                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white">
                    <GripVertical className="h-3 w-3" /> arrastar
                  </span>
                </div>
              </div>
            ))}
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground flex flex-col items-center justify-center gap-2 text-xs"
            >
              <Plus className="h-5 w-5" /> Adicionar
            </button>
          </div>
        )}
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  );
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
    >
      <img src={src} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
      <button
        onClick={onClose}
        className="absolute top-5 right-5 rounded-full bg-black/60 p-2 text-white hover:bg-black"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function IconChip({
  children,
  onClick,
  as,
  href,
  download,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "a";
  href?: string;
  download?: string;
  title?: string;
}) {
  const cls = "rounded-md bg-black/60 p-1.5 backdrop-blur hover:bg-black/80";
  if (as === "a") {
    return (
      <a
        href={href}
        download={download}
        title={title}
        className={cls}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cls}
    >
      {children}
    </button>
  );
}

/* ============================================================
   6. VIDEOS — two-column card per video (media | content)
============================================================ */
function VideosSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const confirm = useConfirm();
  const [openId, setOpenId] = useState<string | null>(null);

  const add = () => {
    const v: ProductVideo = {
      id: crypto.randomUUID(),
      link: "",
      script: "",
      speech: "",
      audio: "",
      description: "",
      cta: "",
      platform: "TikTok",
      editingNotes: "",
      notes: "",
    };
    updateProduct(product.id, (p) => ({ ...p, videos: [v, ...p.videos] }));
    setOpenId(v.id);
  };

  const upd = (id: string, patch: Partial<ProductVideo>) =>
    updateProduct(product.id, (p) => ({
      ...p,
      videos: p.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));

  const rm = (id: string) =>
    updateProduct(product.id, (p) => ({
      ...p,
      videos: p.videos.filter((v) => v.id !== id),
    }));

  const ingestFile = (id: string, file: File | undefined, kind: "video" | "audio") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (kind === "video") upd(id, { videoDataUrl: url, videoName: file.name });
      else upd(id, { audioDataUrl: url, audioName: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section>
      <SectionTitle
        hint="Vídeos do anúncio do produto. Mídia à esquerda, roteiro à direita."
        action={
          <Btn variant="soft" size="sm" onClick={add}>
            <Plus className="h-3.5 w-3.5" /> Novo vídeo
          </Btn>
        }
      >
        Vídeos
      </SectionTitle>

      {product.videos.length === 0 ? (
        <div className="rounded-2xl bg-surface/60 py-12 text-center text-sm text-muted-foreground">
          Nenhum vídeo ainda. Crie o primeiro para começar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {product.videos.map((v, i) => {
            const open = openId === v.id;
            const title = v.cta || v.videoName || `Vídeo #${product.videos.length - i}`;
            return (
              <div key={v.id} className="rounded-2xl bg-surface overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => setOpenId(open ? null : v.id)}
                    className="rounded-md p-1 hover:bg-accent"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  <input
                    value={v.cta}
                    onChange={(e) => upd(v.id, { cta: e.target.value })}
                    placeholder={title}
                    className="flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/50"
                  />
                  <select
                    value={v.platform}
                    onChange={(e) => upd(v.id, { platform: e.target.value })}
                    className="rounded-md bg-background/60 px-2 py-1 text-xs outline-none"
                  >
                    <option>TikTok</option>
                    <option>Reels</option>
                    <option>Shorts</option>
                    <option>YouTube</option>
                    <option>Mercado Livre</option>
                    <option>Outro</option>
                  </select>
                  {v.videoDataUrl && (
                    <span className="text-[10px] uppercase tracking-wider text-success">
                      ● arquivo
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      if (
                        await confirm({
                          title: "Excluir este vídeo?",
                          message: "O roteiro, mídia e notas vinculadas serão removidos.",
                          confirmLabel: "Excluir",
                          tone: "danger",
                        })
                      )
                        rm(v.id);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {open && (
                  <div className="grid lg:grid-cols-[340px_1fr] gap-6 px-6 pb-6 pt-2 border-t border-border/50">
                    <div className="flex flex-col gap-3">
                      <SubLabel>Mídia</SubLabel>
                      {v.videoDataUrl ? (
                        <video
                          src={v.videoDataUrl}
                          controls
                          className="w-full rounded-xl bg-black aspect-[9/16] object-contain"
                        />
                      ) : (
                        <div className="w-full rounded-xl bg-background/50 aspect-[9/16] flex items-center justify-center text-xs text-muted-foreground/60">
                          sem vídeo
                        </div>
                      )}
                      <FileSlot
                        label={v.videoName || "Carregar vídeo"}
                        accept="video/*"
                        onFile={(f) => ingestFile(v.id, f, "video")}
                        onClear={() => upd(v.id, { videoDataUrl: undefined, videoName: undefined })}
                        hasFile={!!v.videoDataUrl}
                      />
                      <FileSlot
                        label={v.audioName || "Carregar áudio"}
                        accept="audio/*"
                        onFile={(f) => ingestFile(v.id, f, "audio")}
                        onClear={() => upd(v.id, { audioDataUrl: undefined, audioName: undefined })}
                        hasFile={!!v.audioDataUrl}
                      />
                      {v.audioDataUrl && <audio src={v.audioDataUrl} controls className="w-full" />}
                      <div className="flex gap-2 mt-1">
                        <input
                          value={v.link}
                          onChange={(e) => upd(v.id, { link: e.target.value })}
                          placeholder="Link externo"
                          className="flex-1 bg-input/40 rounded-lg px-3 py-2 text-sm outline-none focus:bg-input/70"
                        />
                        {v.link && (
                          <a
                            href={v.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-accent px-3 hover:bg-accent/70"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      <div>
                        <SubLabel>Roteiro</SubLabel>
                        <div className="rounded-lg bg-background/40 px-4 py-3">
                          <AutoTextArea
                            value={v.script}
                            onChange={(e) => upd(v.id, { script: e.target.value })}
                            placeholder="Estrutura do vídeo cena a cena..."
                            minRows={5}
                          />
                        </div>
                      </div>
                      <div>
                        <SubLabel>Falas</SubLabel>
                        <div className="rounded-lg bg-background/40 px-4 py-3">
                          <AutoTextArea
                            value={v.speech}
                            onChange={(e) => upd(v.id, { speech: e.target.value })}
                            placeholder="Texto exato a ser falado..."
                            minRows={4}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <SubLabel>Referência de áudio / música</SubLabel>
                          <input
                            value={v.audio}
                            onChange={(e) => upd(v.id, { audio: e.target.value })}
                            placeholder="Nome / link da trilha"
                            className="w-full bg-input/40 rounded-lg px-3 py-2 text-sm outline-none focus:bg-input/70"
                          />
                        </div>
                        <div>
                          <SubLabel>Notas de edição</SubLabel>
                          <input
                            value={v.editingNotes}
                            onChange={(e) => upd(v.id, { editingNotes: e.target.value })}
                            placeholder="Cortes, transições, ritmo..."
                            className="w-full bg-input/40 rounded-lg px-3 py-2 text-sm outline-none focus:bg-input/70"
                          />
                        </div>
                      </div>
                      <div>
                        <SubLabel>Notas gerais</SubLabel>
                        <div className="rounded-lg bg-background/40 px-4 py-3">
                          <AutoTextArea
                            value={v.notes}
                            onChange={(e) => upd(v.id, { notes: e.target.value })}
                            placeholder="Ganchos, observações, ideias..."
                            minRows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}



function FileSlot({
  label,
  accept,
  onFile,
  onClear,
  hasFile,
}: {
  label: string;
  accept: string;
  onFile: (f: File | undefined) => void;
  onClear: () => void;
  hasFile: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-input/40 px-3 py-2 text-sm">
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        onClick={() => ref.current?.click()}
        className="flex-1 flex items-center gap-2 text-left text-muted-foreground hover:text-foreground"
      >
        <Upload className="h-3.5 w-3.5" />
        <span className="truncate">{label}</span>
      </button>
      {hasFile && (
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
          title="Remover"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
