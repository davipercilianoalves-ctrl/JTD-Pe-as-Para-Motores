import { useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import { useStore, useSelectedProduct } from "@/lib/store";
import type {
  Product,
  TitleEntry,
  TitleVariant,
  PricingData,
  CompetitorBlock,
  MarketplaceData,
} from "@/lib/types";
import {
  AutoTextArea,
  Btn,
  Field,
  NumberInput,
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
          {/* — HEADER — */}
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

          {/* Marketplace switcher — applies to títulos & descrição */}
          <div className="mt-10 flex items-center gap-1 rounded-xl bg-surface p-1 w-fit">
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

          {/* ========== 1. KEYWORDS — heart of the workspace ========== */}
          <div className="mt-12">
            <KeywordsSection product={product} />
          </div>

          {/* ========== 2. TITLES — sit right under keywords ========== */}
          <div className="mt-14">
            <TitlesSection product={product} market={market} />
          </div>

          {/* ========== 3. PRICING — premium strategic panel ========== */}
          <div className="mt-16">
            <PricingSection product={product} />
          </div>

          {/* ========== 4. IMAGES ========== */}
          <div className="mt-16">
            <ImagesSection product={product} />
          </div>

          {/* ========== 5. DESCRIPTIONS ========== */}
          <div className="mt-16">
            <DescriptionSection product={product} market={market} />
          </div>

          {/* — SECONDARY — Concorrentes */}
          <div className="mt-20">
            <CompetitorsSection product={product} />
          </div>

          {/* — META (collapsed) */}
          <div className="mt-16">
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
   KEYWORDS — large clean input, chip list, copy actions
============================================================ */
function KeywordsSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [copied, setCopied] = useState(false);

  const text = product.keywordsText;
  const keywords = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    [text],
  );

  const copyAll = () => {
    navigator.clipboard.writeText(keywords.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section>
      <SectionTitle
        hint="O centro do fluxo. Uma por linha."
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">
              {keywords.length} palavras
            </span>
            <Btn variant="soft" size="sm" onClick={copyAll} disabled={!keywords.length}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar tudo"}
            </Btn>
          </div>
        }
      >
        Palavras-chave
      </SectionTitle>

      <div className="rounded-2xl bg-surface px-7 py-6">
        <AutoTextArea
          value={text}
          onChange={(e) => updateProduct(product.id, { keywordsText: e.target.value })}
          placeholder={"kit motor vw ap 1.6\njunta cabeçote\npistão forjado\n..."}
          className="text-lg leading-loose font-mono"
          minRows={6}
        />
      </div>

      {keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {keywords.map((kw, i) => (
            <button
              key={i}
              onClick={() => navigator.clipboard.writeText(kw)}
              title="Copiar"
              className="group inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm hover:bg-surface-elevated transition-colors"
            >
              {kw}
              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   TITLES — sit close to keywords
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
        hint={`Variações para ${MARKETS.find((m) => m.key === market)?.label}`}
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
   PRICING — premium operational panel
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
    const baseCost = p.cost + p.shipping + p.packaging + p.ads;
    const feesPct = p.marketplaceFee + p.commission + p.taxes;
    const finalPrice = baseCost * (1 + p.markup / 100);
    const discounted = finalPrice * (1 - p.discount / 100);
    const fees = discounted * (feesPct / 100);
    const net = discounted - baseCost - fees;
    const marginPct = discounted > 0 ? (net / discounted) * 100 : 0;
    const minPrice = baseCost / Math.max(1 - feesPct / 100, 0.01);
    return {
      baseCost,
      feesPct,
      fees,
      finalPrice,
      discounted,
      net,
      marginPct,
      minPrice,
      psychPrice: psych(finalPrice),
    };
  }, [p]);

  return (
    <section>
      <SectionTitle hint="Custos rápidos em cima, resultado estratégico embaixo.">
        Precificação
      </SectionTitle>

      {/* Compact cost row */}
      <div className="rounded-2xl bg-surface p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <PriceInput label="Custo" value={p.cost} onChange={(v) => set("cost", v)} prefix="R$" />
          <PriceInput label="Frete" value={p.shipping} onChange={(v) => set("shipping", v)} prefix="R$" />
          <PriceInput label="Embalagem" value={p.packaging} onChange={(v) => set("packaging", v)} prefix="R$" />
          <PriceInput label="Ads" value={p.ads} onChange={(v) => set("ads", v)} prefix="R$" />
          <PriceInput label="Imposto" value={p.taxes} onChange={(v) => set("taxes", v)} suffix="%" />
          <PriceInput
            label="Taxa MP"
            value={p.marketplaceFee}
            onChange={(v) => set("marketplaceFee", v)}
            suffix="%"
          />
          <PriceInput
            label="Comissão"
            value={p.commission}
            onChange={(v) => set("commission", v)}
            suffix="%"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5">
          <PriceInput label="Markup" value={p.markup} onChange={(v) => set("markup", v)} suffix="%" />
          <PriceInput
            label="Desconto promo"
            value={p.discount}
            onChange={(v) => set("discount", v)}
            suffix="%"
          />
          <PriceInput
            label="Desconto máx"
            value={p.maxDiscount}
            onChange={(v) => set("maxDiscount", v)}
            suffix="%"
          />
        </div>
      </div>

      {/* RESULTS — big, premium */}
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
          <MiniRow label="Custo base" value={brl(c.baseCost)} />
          <MiniRow label="Total de taxas" value={`${c.feesPct.toFixed(1)}%`} />
          <MiniRow label="Em R$" value={brl(c.fees)} />
          <div className="h-px bg-border my-1" />
          <MiniRow label="Mínimo viável" value={brl(c.minPrice)} />
          <MiniRow label="Psicológico" value={brl(c.psychPrice)} accent />
        </div>
      </div>
    </section>
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
   IMAGES — clean gallery, drag & drop
============================================================ */
function ImagesSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

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
            notes: string;
          }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                dataUrl: reader.result as string,
                name: f.name,
                favorite: false,
                notes: "",
              });
            reader.readAsDataURL(f);
          }),
      ),
    );
    updateProduct(product.id, (p) => ({ ...p, images: [...p.images, ...newImgs] }));
  };

  return (
    <section>
      <SectionTitle
        hint={`${product.images.length} imagem(ns)`}
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
            className="w-full py-20 text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="mx-auto h-7 w-7 mb-3" />
            <div className="text-base font-medium">Arraste imagens ou clique para enviar</div>
          </button>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {product.images.map((img) => (
              <div
                key={img.id}
                className="group relative overflow-hidden rounded-xl bg-background"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconChip
                    onClick={() =>
                      updateProduct(product.id, (p) => ({
                        ...p,
                        images: p.images.map((x) =>
                          x.id === img.id ? { ...x, favorite: !x.favorite } : x,
                        ),
                      }))
                    }
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5",
                        img.favorite ? "fill-warning text-warning" : "text-white",
                      )}
                    />
                  </IconChip>
                  <IconChip
                    as="a"
                    href={img.dataUrl}
                    download={img.name}
                  >
                    <Download className="h-3.5 w-3.5 text-white" />
                  </IconChip>
                  <IconChip
                    onClick={() =>
                      updateProduct(product.id, (p) => ({
                        ...p,
                        images: p.images.filter((x) => x.id !== img.id),
                      }))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </IconChip>
                </div>
                {img.favorite && (
                  <Star className="absolute top-2 left-2 h-3.5 w-3.5 fill-warning text-warning drop-shadow" />
                )}
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
    </section>
  );
}

function IconChip({
  children,
  onClick,
  as,
  href,
  download,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "a";
  href?: string;
  download?: string;
}) {
  const cls = "rounded-md bg-black/60 p-1.5 backdrop-blur hover:bg-black/80";
  if (as === "a") {
    return (
      <a href={href} download={download} className={cls} onClick={(e) => e.stopPropagation()}>
        {children}
      </a>
    );
  }
  return (
    <button
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
   DESCRIPTION — auto-expanding text flow
============================================================ */
function DescriptionSection({ product, market }: { product: Product; market: MK }) {
  const { updateProduct } = useStore();
  const data = product[market];

  const set = <K extends keyof MarketplaceData>(key: K, value: MarketplaceData[K]) =>
    updateProduct(product.id, (p) => ({ ...p, [market]: { ...p[market], [key]: value } }));

  return (
    <section>
      <SectionTitle hint={`Para ${MARKETS.find((m) => m.key === market)?.label}`}>
        Descrição & SEO
      </SectionTitle>

      <div className="rounded-2xl bg-surface p-7 flex flex-col gap-7">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Descrição principal
          </div>
          <AutoTextArea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Escreva a descrição do anúncio..."
            className="text-base leading-loose"
            minRows={6}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 pt-6 border-t border-border">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              Bullet points / ficha técnica
            </div>
            <AutoTextArea
              value={data.media}
              onChange={(e) => set("media", e.target.value)}
              placeholder={"• Item 1\n• Item 2"}
              minRows={3}
            />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              Palavras-chave de SEO
            </div>
            <AutoTextArea
              value={data.seo}
              onChange={(e) => set("seo", e.target.value)}
              minRows={3}
            />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              Estratégia / copy viral
            </div>
            <AutoTextArea
              value={data.strategies}
              onChange={(e) => set("strategies", e.target.value)}
              minRows={3}
            />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
              Notas
            </div>
            <AutoTextArea
              value={data.notes}
              onChange={(e) => set("notes", e.target.value)}
              minRows={3}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   COMPETITORS — fast inline analysis blocks
============================================================ */
function CompetitorsSection({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const add = () => {
    const c: CompetitorBlock = {
      id: crypto.randomUUID(),
      link: "",
      title: "",
      description: "",
      notes: "",
      strongWords: "",
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
        hint="Cole link, título e observações. Rápido."
        action={
          <Btn variant="soft" size="sm" onClick={add}>
            <Plus className="h-3.5 w-3.5" /> Novo
          </Btn>
        }
      >
        Análise de concorrentes
      </SectionTitle>

      {product.competitors.length === 0 ? (
        <div className="rounded-2xl bg-surface/60 py-12 text-center text-sm text-muted-foreground">
          Nenhum concorrente ainda.
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
                      {c.marketplace}
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
                      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                        Descrição
                      </div>
                      <AutoTextArea
                        value={c.description}
                        onChange={(e) => upd(c.id, { description: e.target.value })}
                        placeholder="Cole a descrição completa..."
                        minRows={4}
                      />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-5">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                          Palavras fortes
                        </div>
                        <AutoTextArea
                          value={c.strongWords}
                          onChange={(e) => upd(c.id, { strongWords: e.target.value })}
                          minRows={3}
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                          Observações
                        </div>
                        <AutoTextArea
                          value={c.notes}
                          onChange={(e) => upd(c.id, { notes: e.target.value })}
                          minRows={3}
                        />
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
