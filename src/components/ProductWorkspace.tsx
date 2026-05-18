import { useState } from "react";
import { Star, Package2 } from "lucide-react";
import { useStore, useSelectedProduct } from "@/lib/store";
import { Field, TextInput, TextArea } from "@/components/ui-kit";
import { GeneralTab } from "@/components/tabs/GeneralTab";
import {
  MercadoLivreTab,
  ShopeeTab,
  AmazonTab,
  TikTokTab,
} from "@/components/tabs/MarketplaceTabs";
import { PricingTab } from "@/components/tabs/PricingTab";
import { ImagesTab } from "@/components/tabs/ImagesTab";
import { VideosTab, ViralClipsTab } from "@/components/tabs/MediaTabs";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "geral", label: "Geral" },
  { key: "ml", label: "Mercado Livre" },
  { key: "shopee", label: "Shopee" },
  { key: "amazon", label: "Amazon" },
  { key: "tiktok", label: "TikTok" },
  { key: "preco", label: "Precificação" },
  { key: "imagens", label: "Imagens" },
  { key: "videos", label: "Vídeos" },
  { key: "clips", label: "Clips Virais" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ProductWorkspace() {
  const product = useSelectedProduct();
  const { updateProduct, toggleFavorite, createProduct } = useStore();
  const [tab, setTab] = useState<TabKey>("geral");

  if (!product) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center text-center px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mb-4">
          <Package2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Selecione ou crie um produto</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          O JTD Motors Hub centraliza toda a operação de criação de produtos: SEO, marketplaces,
          mídias, precificação e biblioteca viral.
        </p>
        <button
          onClick={() => createProduct()}
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Criar novo produto
        </button>
      </div>
    );
  }

  const set = <K extends keyof typeof product>(key: K, value: (typeof product)[K]) =>
    updateProduct(product.id, { [key]: value } as Partial<typeof product>);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      {/* Header / top fields */}
      <div className="border-b border-border bg-surface/40 px-6 py-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <input
              value={product.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nome do produto"
              className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/50"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
            </div>
          </div>
          <button
            onClick={() => toggleFavorite(product.id)}
            className="rounded-md border border-border p-2 hover:bg-accent"
          >
            <Star
              className={cn("h-4 w-4", product.favorite && "fill-warning text-warning")}
            />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <TextInput value={product.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Fornecedor">
            <TextInput value={product.supplier} onChange={(e) => set("supplier", e.target.value)} />
          </Field>
          <Field label="Observações internas" className="sm:col-span-2 lg:col-span-3">
            <TextArea
              rows={1}
              value={product.internalNotes}
              onChange={(e) => set("internalNotes", e.target.value)}
              placeholder="Anotações privadas do time..."
            />
          </Field>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background px-6">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "geral" && <GeneralTab product={product} />}
        {tab === "ml" && <MercadoLivreTab product={product} />}
        {tab === "shopee" && <ShopeeTab product={product} />}
        {tab === "amazon" && <AmazonTab product={product} />}
        {tab === "tiktok" && <TikTokTab product={product} />}
        {tab === "preco" && <PricingTab product={product} />}
        {tab === "imagens" && <ImagesTab product={product} />}
        {tab === "videos" && <VideosTab product={product} />}
        {tab === "clips" && <ViralClipsTab product={product} />}
      </div>
    </div>
  );
}
