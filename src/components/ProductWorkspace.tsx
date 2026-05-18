import { useMemo, useRef, useState, useEffect } from "react";
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
  Maximize2,
  GripVertical,
} from "lucide-react";
import { useStore, useSelectedProduct } from "@/lib/store";
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
} from "@/lib/types";
import {
  AutoTextArea,
  Btn,
  Field,
  SectionTitle,
  TextInput,
} from "@/components/ui-kit";
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
  const [market, setMarket] = useState<MK>("mercadoLivre");
  const [showMeta, setShowMeta] = useState(false);

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
            <div className="flex items-center gap-1">
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
                onClick={() => {
                  if (confirm(`Excluir "${product.name}"?`)) deleteProduct(product.id);
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
            Atualizado {new Date(product.updatedAt).toLocaleString("pt-BR")} ·
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
          <div className="mt-16 flex items-center gap-1 rounded-xl bg-surface p-1 w-fit">
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

          {/* 3 — TITLES + DESCRIPTION (continuous flow) */}
          <div className="mt-6">
            <TitlesSection product={product} market={market} />
          </div>
          <div className="mt-10">
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
                    className="rounded-lg bg-input/40 px-3.5 py-2.5"
                    minRows={2}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   1. KEYWORDS — horizontal chip flow, manual + populated by competitors
============================================================ */
function KeywordsSection({ product }: { product: Product }) {
  const { addKeywordTokens, removeKeyword, toggleKeywordFavorite } = useStore();
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "fav">("all");

  const commit = () => {
    const toks = parseKeywordTokens(draft);
    if (!toks.length) return;
    addKeywordTokens(product.id, toks);
    setDraft("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
  };

  const sorted = useMemo(() => {
    const list = filter === "fav" ? product.keywords.filter((k) => k.favorite) : product.keywords;
    return [...list].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.uses - a.uses;
    });
  }, [product.keywords, filter]);

  const copyAll = () => {
    navigator.clipboard.writeText(sorted.map((k) => k.display).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section>
      <SectionTitle
        hint="Extraídas automaticamente da análise de concorrentes ou digitadas aqui."
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">
              {product.keywords.length} palavras
            </span>
            <Btn variant="soft" size="sm" onClick={copyAll} disabled={!sorted.length}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar tudo"}
            </Btn>
          </div>
        }
      >
        Palavras-chave
      </SectionTitle>

      <div className="rounded-2xl bg-surface px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={commit}
            placeholder="Adicionar palavra-chave (Enter ou vírgula)"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/40"
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
              <Star className="inline h-3 w-3 mr-1" /> Favoritas
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground/70">
            Nenhuma palavra ainda. Analise concorrentes para popular automaticamente.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((k) => (
              <KeywordChip
                key={k.id}
                kw={k}
                onCopy={() => navigator.clipboard.writeText(k.display)}
                onFav={() => toggleKeywordFavorite(product.id, k.id)}
                onRemove={() => removeKeyword(product.id, k.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function KeywordChip({
  kw,
  onCopy,
  onFav,
  onRemove,
}: {
  kw: Keyword;
  onCopy: () => void;
  onFav: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full pl-3 pr-1 py-1 text-sm transition-colors",
        kw.favorite
          ? "bg-warning/15 text-warning ring-1 ring-warning/30"
          : "bg-background/70 hover:bg-background",
      )}
    >
      <button onClick={onCopy} className="cursor-copy" title="Copiar">
        {kw.display}
      </button>
      {kw.uses > 1 && (
        <span className="text-[10px] tabular-nums text-muted-foreground">({kw.uses})</span>
      )}
      <button
        onClick={onFav}
        className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-0.5"
        title="Favoritar"
      >
        <Star className={cn("h-3 w-3", kw.favorite && "fill-warning text-warning opacity-100")} />
      </button>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-0.5"
        title="Remover"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ============================================================
   2. COMPETITORS — fast inline blocks; keywords feed back into main list
============================================================ */
function CompetitorsSection({ product }: { product: Product }) {
  const { updateProduct, addKeywordTokens } = useStore();
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
          <Btn variant="soft" size="sm" onClick={add}>
            <Plus className="h-3.5 w-3.5" /> Novo concorrente
          </Btn>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Excluir este concorrente?")) rm(c.id);
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
                      />
                    </div>

                    <CompetitorKeywords
                      block={c}
                      onChange={(words) => upd(c.id, { keywordsFound: words })}
                      onCommit={(words) => addKeywordTokens(product.id, words)}
                    />

                    <div>
                      <SubLabel>Observações</SubLabel>
                      <AutoTextArea
                        value={c.notes}
                        onChange={(e) => upd(c.id, { notes: e.target.value })}
                        placeholder="O que faz bem? O que dá pra superar?"
                        minRows={3}
                      />
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

function CompetitorKeywords({
  block,
  onChange,
  onCommit,
}: {
  block: CompetitorBlock;
  onChange: (words: string[]) => void;
  onCommit: (words: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const commitTokens = (raw: string) => {
    const toks = parseSingleWords(raw);
    if (!toks.length) return;
    const existing = new Set(block.keywordsFound.map((w) => canonKeyword(w)));
    const fresh: string[] = [];
    const added: string[] = [];
    for (const t of toks) {
      const key = canonKeyword(t);
      if (existing.has(key)) {
        added.push(t); // still count usage globally
        continue;
      }
      existing.add(key);
      fresh.push(t);
      added.push(t);
    }
    if (fresh.length) onChange([...block.keywordsFound, ...fresh]);
    if (added.length) onCommit(added);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      // for Enter/comma: split everything; for Space: split when at least 2 chars typed
      if (e.key === " " && draft.trim().length === 0) return;
      e.preventDefault();
      commitTokens(draft);
      setDraft("");
    }
  };

  const removeWord = (idx: number) => {
    onChange(block.keywordsFound.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <SubLabel>
        Palavras-chave encontradas
        <span className="ml-2 normal-case tracking-normal text-muted-foreground/70 text-[11px]">
          Espaço ou Enter para adicionar — entram na lista principal automaticamente
        </span>
      </SubLabel>
      <div className="rounded-lg bg-input/40 px-3 py-2.5 flex flex-wrap items-center gap-1.5 focus-within:bg-input/70 transition-colors">
        {block.keywordsFound.map((w, i) => (
          <span
            key={i}
            className="group inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs"
          >
            {w}
            <button
              onClick={() => removeWord(i)}
              className="opacity-60 hover:opacity-100"
              title="Remover"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => {
            if (draft.trim()) {
              commitTokens(draft);
              setDraft("");
            }
          }}
          placeholder={block.keywordsFound.length ? "" : "alta temperatura vedação motor..."}
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm py-1"
        />
      </div>
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
   3a. TITLES
============================================================ */
function TitlesSection({ product, market }: { product: Product; market: MK }) {
  const { updateProduct } = useStore();
  const data = product[market];

  const add = (variant: TitleVariant, text = "") => {
    const entry: TitleEntry = { id: crypto.randomUUID(), variant, text };
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: { ...p[market], titles: [...p[market].titles, entry] },
    }));
  };
  const upd = (id: string, text: string) =>
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: {
        ...p[market],
        titles: p[market].titles.map((t) => (t.id === id ? { ...t, text } : t)),
      },
    }));
  const rm = (id: string) =>
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: { ...p[market], titles: p[market].titles.filter((t) => t.id !== id) },
    }));
  const duplicate = (t: TitleEntry) => add(t.variant, t.text);

  return (
    <section>
      <SectionTitle
        hint={`Para ${MARKETS.find((m) => m.key === market)?.label}. Mantenha as palavras-chave em mente.`}
        action={
          <div className="flex flex-wrap gap-1.5">
            {TITLE_VARIANTS.map((v) => (
              <button
                key={v}
                onClick={() => add(v)}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs hover:bg-surface-elevated"
              >
                <Plus className="h-3 w-3" /> {v}
              </button>
            ))}
          </div>
        }
      >
        Títulos
      </SectionTitle>

      <div className="flex flex-col gap-2">
        {data.titles.length === 0 && (
          <div className="rounded-2xl bg-surface/60 py-10 text-center text-sm text-muted-foreground">
            Crie sua primeira variação acima.
          </div>
        )}
        {data.titles.map((t) => {
          const over = t.text.length > 60;
          return (
            <div
              key={t.id}
              className="group flex items-center gap-4 rounded-xl bg-surface px-5 py-3.5 hover:bg-surface-elevated transition-colors"
            >
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80 w-20">
                {t.variant}
              </span>
              <input
                value={t.text}
                onChange={(e) => upd(t.id, e.target.value)}
                placeholder="Digite o título..."
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/40"
              />
              <span
                className={cn(
                  "tabular-nums text-xs shrink-0",
                  over ? "text-warning" : "text-muted-foreground",
                )}
              >
                {t.text.length}/60
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => navigator.clipboard.writeText(t.text)}
                  className="rounded-md p-1.5 hover:bg-accent text-muted-foreground"
                  title="Copiar"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => duplicate(t)}
                  className="rounded-md p-1.5 hover:bg-accent text-muted-foreground"
                  title="Duplicar"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => rm(t.id)}
                  className="rounded-md p-1.5 hover:bg-destructive/10 text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   3b. DESCRIPTION — large, Notion-like
============================================================ */
function DescriptionSection({ product, market }: { product: Product; market: MK }) {
  const { updateProduct } = useStore();
  const data = product[market];

  const set = <K extends keyof MarketplaceData>(key: K, value: MarketplaceData[K]) =>
    updateProduct(product.id, (p) => ({ ...p, [market]: { ...p[market], [key]: value } }));

  return (
    <section>
      <SectionTitle hint={`Espaço amplo. Pense como um documento.`}>Descrição</SectionTitle>

      <div className="rounded-2xl bg-surface px-7 py-6">
        <AutoTextArea
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Escreva a descrição do anúncio..."
          className="text-base leading-loose"
          minRows={8}
        />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-5">
        <SoftBlock label="Bullet points / ficha técnica">
          <AutoTextArea
            value={data.media}
            onChange={(e) => set("media", e.target.value)}
            placeholder={"• Item 1\n• Item 2"}
            minRows={4}
          />
        </SoftBlock>
        <SoftBlock label="SEO complementar">
          <AutoTextArea
            value={data.seo}
            onChange={(e) => set("seo", e.target.value)}
            minRows={4}
          />
        </SoftBlock>
        <SoftBlock label="Estratégia / copy viral">
          <AutoTextArea
            value={data.strategies}
            onChange={(e) => set("strategies", e.target.value)}
            minRows={4}
          />
        </SoftBlock>
        <SoftBlock label="Notas">
          <AutoTextArea
            value={data.notes}
            onChange={(e) => set("notes", e.target.value)}
            minRows={4}
          />
        </SoftBlock>
      </div>
    </section>
  );
}

function SoftBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface/60 px-6 py-5">
      <SubLabel>{label}</SubLabel>
      {children}
    </div>
  );
}

/* ============================================================
   4. PRICING — strategic simulator
============================================================ */
function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function psych(v: number) {
  if (v <= 0) return 0;
  const base = Math.floor(v);
  return base + (v < 100 ? 0.9 : 0.99);
}

function PricingSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const p = product.pricing;
  const set = (key: keyof PricingData, value: number) =>
    updateProduct(product.id, (prod) => ({
      ...prod,
      pricing: { ...prod.pricing, [key]: value },
    }));

  const c = useMemo(() => {
    const baseCost =
      p.cost + p.shipping + p.packaging + p.transportation + p.ads;
    const feesPct = p.marketplaceFee + p.commission + p.taxes;
    const finalPrice = baseCost * (1 + p.markup / 100);
    const discounted = finalPrice * (1 - p.discount / 100);
    const aggressive = finalPrice * (1 - p.maxDiscount / 100);
    const feesValue = discounted * (feesPct / 100);
    const taxValue = discounted * (p.taxes / 100);
    const mpFeeValue = discounted * (p.marketplaceFee / 100);
    const commissionValue = discounted * (p.commission / 100);
    const net = discounted - baseCost - feesValue;
    const marginPct = discounted > 0 ? (net / discounted) * 100 : 0;
    const minPrice = baseCost / Math.max(1 - feesPct / 100, 0.01);
    return {
      baseCost,
      feesPct,
      feesValue,
      taxValue,
      mpFeeValue,
      commissionValue,
      finalPrice,
      discounted,
      aggressive,
      net,
      marginPct,
      minPrice,
      psychPrice: psych(finalPrice),
    };
  }, [p]);

  // proportions for the visibility panel
  const totalSpend = c.baseCost + c.feesValue;
  const pctOf = (v: number) => (c.discounted > 0 ? (v / c.discounted) * 100 : 0);

  return (
    <section>
      <SectionTitle hint="Simulador estratégico. Veja exatamente para onde vai cada real.">
        Precificação
      </SectionTitle>

      <div className="rounded-2xl bg-surface p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <PriceInput label="Custo do produto" value={p.cost} onChange={(v) => set("cost", v)} prefix="R$" />
          <PriceInput label="Frete" value={p.shipping} onChange={(v) => set("shipping", v)} prefix="R$" />
          <PriceInput label="Embalagem" value={p.packaging} onChange={(v) => set("packaging", v)} prefix="R$" />
          <PriceInput
            label="Transporte"
            value={p.transportation}
            onChange={(v) => set("transportation", v)}
            prefix="R$"
          />
          <PriceInput label="Ads" value={p.ads} onChange={(v) => set("ads", v)} prefix="R$" />
          <PriceInput label="Imposto" value={p.taxes} onChange={(v) => set("taxes", v)} suffix="%" />
          <PriceInput label="Taxa marketplace" value={p.marketplaceFee} onChange={(v) => set("marketplaceFee", v)} suffix="%" />
          <PriceInput label="Comissão" value={p.commission} onChange={(v) => set("commission", v)} suffix="%" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5">
          <PriceInput label="Markup" value={p.markup} onChange={(v) => set("markup", v)} suffix="%" />
          <PriceInput label="Desconto promo" value={p.discount} onChange={(v) => set("discount", v)} suffix="%" />
          <PriceInput label="Desconto máx" value={p.maxDiscount} onChange={(v) => set("maxDiscount", v)} suffix="%" />
        </div>
      </div>

      {/* RESULTS */}
      <div className="mt-5 grid lg:grid-cols-[2fr_1fr] gap-5">
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8">
          <div className="grid grid-cols-2 gap-8">
            <ResultBig label="Preço final" value={brl(c.discounted)} />
            <ResultBig
              label="Lucro líquido"
              value={brl(c.net)}
              tone={c.net >= 0 ? "positive" : "negative"}
            />
            <ResultBig
              label="Margem"
              value={`${c.marginPct.toFixed(1)}%`}
              tone={c.marginPct >= 0 ? "positive" : "negative"}
              small
            />
            <ResultBig label="Preço ideal" value={brl(c.finalPrice)} small />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-6 flex flex-col justify-center gap-3 text-sm">
          <MiniRow label="Mínimo viável" value={brl(c.minPrice)} />
          <MiniRow label="Psicológico" value={brl(c.psychPrice)} accent />
          <MiniRow label="Agressivo" value={brl(c.aggressive)} />
          <div className="h-px bg-border my-1" />
          <MiniRow label="Custo base" value={brl(c.baseCost)} />
          <MiniRow label="Total de taxas" value={brl(c.feesValue)} />
        </div>
      </div>

      {/* OPERATIONAL EXPLANATION */}
      <div className="mt-5 rounded-2xl bg-surface px-7 py-6">
        <SubLabel>Para onde vai seu dinheiro</SubLabel>
        <div className="grid lg:grid-cols-2 gap-x-10 gap-y-2 mt-3 text-sm">
          <SpendRow label="Custo do produto" value={p.cost} pct={pctOf(p.cost)} />
          <SpendRow label="Frete" value={p.shipping} pct={pctOf(p.shipping)} />
          <SpendRow label="Embalagem" value={p.packaging} pct={pctOf(p.packaging)} />
          <SpendRow label="Transporte" value={p.transportation} pct={pctOf(p.transportation)} />
          <SpendRow label="Ads" value={p.ads} pct={pctOf(p.ads)} />
          <SpendRow label="Imposto" value={c.taxValue} pct={pctOf(c.taxValue)} />
          <SpendRow label="Taxa marketplace" value={c.mpFeeValue} pct={pctOf(c.mpFeeValue)} />
          <SpendRow label="Comissão" value={c.commissionValue} pct={pctOf(c.commissionValue)} />
        </div>

        <div className="mt-6 pt-5 border-t border-border space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Custo base total:{" "}
            <span className="text-foreground font-medium">{brl(c.baseCost)}</span> (
            {pctOf(c.baseCost).toFixed(1)}% do preço final).
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Taxas representam{" "}
            <span className="text-foreground font-medium">
              {c.feesPct.toFixed(1)}%
            </span>{" "}
            do preço final ({brl(c.feesValue)}).
          </p>
          <p
            className={cn(
              "text-base leading-relaxed",
              c.net >= 0 ? "text-success" : "text-destructive",
            )}
          >
            Seu lucro líquido é{" "}
            <span className="font-semibold">{brl(c.net)}</span> (
            <span className="font-semibold">{c.marginPct.toFixed(1)}%</span> de margem).
          </p>
          {totalSpend === 0 && (
            <p className="text-sm text-muted-foreground/70">
              Preencha os custos acima para ver a análise.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function SpendRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  const safe = isFinite(pct) ? pct : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-background/80 overflow-hidden">
        <div
          className="h-full bg-primary/60"
          style={{ width: `${Math.min(100, Math.max(0, safe))}%` }}
        />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground w-20 text-right">
        {brl(value)}
      </span>
      <span className="tabular-nums text-xs w-12 text-right">{safe.toFixed(1)}%</span>
    </div>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5 rounded-lg bg-input/50 px-3 py-2 focus-within:ring-2 focus-within:ring-ring/40">
        {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          step="0.01"
          value={value || ""}
          onChange={(e) => onChange(+e.target.value || 0)}
          placeholder="0"
          className="w-full bg-transparent outline-none tabular-nums text-base"
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultBig({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  small?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
        {label}
      </div>
      <div
        className={cn(
          "font-semibold tabular-nums tracking-tight",
          small ? "text-3xl" : "text-5xl",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums font-medium", accent && "text-primary")}>{value}</span>
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
   6. VIDEOS — one clean block per video
============================================================ */
function VideosSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
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
      platform: "",
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
        hint="Roteiro, falas, áudio e arquivo — tudo junto."
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
          Sem vídeos ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {product.videos.map((v, i) => {
            const open = openId === v.id;
            return (
              <div key={v.id} className="rounded-xl bg-surface overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-surface-elevated"
                  onClick={() => setOpenId(open ? null : v.id)}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {v.cta || v.platform || v.videoName || `Vídeo #${product.videos.length - i}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {v.platform || "Sem plataforma"}
                      {v.videoDataUrl && " · arquivo carregado"}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Excluir este vídeo?")) rm(v.id);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {open && (
                  <div className="px-6 pb-6 pt-2 flex flex-col gap-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex gap-2">
                        <input
                          value={v.link}
                          onChange={(e) => upd(v.id, { link: e.target.value })}
                          placeholder="Link externo"
                          className="flex-1 bg-input/40 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-input/70"
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
                      <input
                        value={v.platform}
                        onChange={(e) => upd(v.id, { platform: e.target.value })}
                        placeholder="Plataforma (TikTok, Reels...)"
                        className="bg-input/40 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-input/70"
                      />
                    </div>

                    {v.videoDataUrl ? (
                      <video src={v.videoDataUrl} controls className="w-full rounded-xl bg-black max-h-[420px]" />
                    ) : null}

                    <div className="grid md:grid-cols-2 gap-3">
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
                    </div>

                    {v.audioDataUrl && <audio src={v.audioDataUrl} controls className="w-full" />}

                    <div>
                      <SubLabel>Roteiro</SubLabel>
                      <AutoTextArea
                        value={v.script}
                        onChange={(e) => upd(v.id, { script: e.target.value })}
                        placeholder="Estrutura do vídeo cena a cena..."
                        minRows={5}
                      />
                    </div>
                    <div>
                      <SubLabel>Falas</SubLabel>
                      <AutoTextArea
                        value={v.speech}
                        onChange={(e) => upd(v.id, { speech: e.target.value })}
                        placeholder="Texto exato a ser falado..."
                        minRows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        value={v.cta}
                        onChange={(e) => upd(v.id, { cta: e.target.value })}
                        placeholder="CTA"
                        className="bg-input/40 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-input/70"
                      />
                      <input
                        value={v.audio}
                        onChange={(e) => upd(v.id, { audio: e.target.value })}
                        placeholder="Referência de áudio / música"
                        className="bg-input/40 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:bg-input/70"
                      />
                    </div>

                    <div>
                      <SubLabel>Notas</SubLabel>
                      <AutoTextArea
                        value={v.notes}
                        onChange={(e) => upd(v.id, { notes: e.target.value })}
                        placeholder="Edição, ganchos, observações..."
                        minRows={3}
                      />
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
