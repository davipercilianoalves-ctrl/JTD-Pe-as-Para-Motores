import { useStore } from "@/lib/store";
import type { Product, MarketplaceData, TitleVariant, TitleEntry } from "@/lib/types";
import { Field, TextInput, TextArea, SectionTitle } from "@/components/ui-kit";
import { Copy, Plus, Trash2 } from "lucide-react";

type MarketplaceKey = "mercadoLivre" | "shopee" | "amazon" | "tiktok";

function useMarketplaceFields({
  product,
  mkKey,
}: {
  product: Product;
  mkKey: MarketplaceKey;
}) {
  const { updateProduct } = useStore();
  const data = product[mkKey];

  const setField = <K extends keyof MarketplaceData>(key: K, value: MarketplaceData[K]) => {
    updateProduct(product.id, (p) => ({ ...p, [mkKey]: { ...p[mkKey], [key]: value } }));
  };

  const setExtra = (key: string, value: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      [mkKey]: { ...p[mkKey], extras: { ...p[mkKey].extras, [key]: value } },
    }));
  };

  return { data, setField, setExtra };
}

export function MercadoLivreTab({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const { data, setField } = useMarketplaceFields({ product, mkKey: "mercadoLivre" });

  const addTitle = (variant: TitleVariant) => {
    const entry: TitleEntry = { id: crypto.randomUUID(), variant, text: "" };
    updateProduct(product.id, (p) => ({
      ...p,
      mercadoLivre: { ...p.mercadoLivre, titles: [...p.mercadoLivre.titles, entry] },
    }));
  };

  const updateTitle = (id: string, text: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      mercadoLivre: {
        ...p.mercadoLivre,
        titles: p.mercadoLivre.titles.map((t) => (t.id === id ? { ...t, text } : t)),
      },
    }));
  };

  const removeTitle = (id: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      mercadoLivre: { ...p.mercadoLivre, titles: p.mercadoLivre.titles.filter((t) => t.id !== id) },
    }));
  };

  const variants: TitleVariant[] = ["SEO Forte", "Conversão", "Mobile", "Curto", "Completo"];

  const highlightSeo = (text: string, seo: string) => {
    if (!seo.trim()) return text;
    const terms = seo.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
    if (terms.length === 0) return text;
    const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return text.split(re).map((part, i) =>
      terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="bg-primary/30 text-primary-foreground/95 rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-5">
        <SectionTitle>Versões de título</SectionTitle>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {variants.map((v) => (
            <button
              key={v}
              onClick={() => addTitle(v)}
              className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs hover:bg-accent/80"
            >
              <Plus className="h-3 w-3" /> {v}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 max-h-[500px] overflow-auto pr-1">
          {data.titles.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              Crie versões de título acima
            </div>
          )}
          {data.titles.map((t) => (
            <div key={t.id} className="rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  {t.variant}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                  <span className={t.text.length > 60 ? "text-warning" : ""}>
                    {t.text.length}/60
                  </span>
                  <button onClick={() => navigator.clipboard.writeText(t.text)}>
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeTitle(t.id)} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <TextInput
                value={t.text}
                onChange={(e) => updateTitle(t.id, e.target.value)}
                placeholder="Digite o título..."
              />
              {t.text && (
                <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {highlightSeo(t.text, data.seo)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-5 flex flex-col gap-4">
        <SectionTitle>SEO & Descrição</SectionTitle>
        <Field label="Palavras-chave de SEO (separadas por vírgula)">
          <TextArea
            rows={2}
            value={data.seo}
            onChange={(e) => setField("seo", e.target.value)}
            placeholder="kit motor, junta cabeçote, vw ap 1.6..."
          />
        </Field>
        <Field label="Descrição">
          <TextArea
            rows={8}
            value={data.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
        <Field label="Ficha técnica / especificações">
          <TextArea
            rows={4}
            value={data.strategies}
            onChange={(e) => setField("strategies", e.target.value)}
            placeholder="Aplicações, dimensões, compatibilidade..."
          />
        </Field>
        <Field label="Bullet points">
          <TextArea
            rows={4}
            value={data.media}
            onChange={(e) => setField("media", e.target.value)}
            placeholder="• Item 1&#10;• Item 2"
          />
        </Field>
        <Field label="Observações internas">
          <TextArea rows={2} value={data.notes} onChange={(e) => setField("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

export function ShopeeTab({ product }: { product: Product }) {
  const { data, setField, setExtra } = useMarketplaceFields({ product, mkKey: "shopee" });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-5 flex flex-col gap-4">
        <SectionTitle>Título curto & Hashtags</SectionTitle>
        <Field label="Título curto (foco mobile)" hint={`${(data.extras.shortTitle ?? "").length} caracteres`}>
          <TextInput
            value={data.extras.shortTitle ?? ""}
            onChange={(e) => setExtra("shortTitle", e.target.value)}
          />
        </Field>
        <Field label="Hashtags">
          <TextArea
            rows={3}
            value={data.extras.hashtags ?? ""}
            onChange={(e) => setExtra("hashtags", e.target.value)}
            placeholder="#kitmotor #vw #ap1600"
          />
        </Field>
        <Field label="Descrição curta">
          <TextArea
            rows={5}
            value={data.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
      </div>
      <div className="panel p-5 flex flex-col gap-4">
        <SectionTitle>Estrutura viral</SectionTitle>
        <Field label="Copy viral (estrutura mobile)">
          <TextArea
            rows={6}
            value={data.strategies}
            onChange={(e) => setField("strategies", e.target.value)}
            placeholder="Gancho → Benefício → Prova → CTA"
          />
        </Field>
        <Field label="SEO Shopee">
          <TextArea rows={3} value={data.seo} onChange={(e) => setField("seo", e.target.value)} />
        </Field>
        <Field label="Observações">
          <TextArea rows={3} value={data.notes} onChange={(e) => setField("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

export function AmazonTab({ product }: { product: Product }) {
  const { data, setField, setExtra } = useMarketplaceFields({ product, mkKey: "amazon" });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-5 flex flex-col gap-4">
        <SectionTitle>Bullet points & Descrição</SectionTitle>
        <Field label="Bullet points (1 por linha)">
          <TextArea
            rows={6}
            value={data.extras.bullets ?? ""}
            onChange={(e) => setExtra("bullets", e.target.value)}
            placeholder="• Recurso 1&#10;• Recurso 2"
          />
        </Field>
        <Field label="Descrição técnica">
          <TextArea
            rows={8}
            value={data.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
      </div>
      <div className="panel p-5 flex flex-col gap-4">
        <SectionTitle>SEO Amazon</SectionTitle>
        <Field label="Backend keywords (search terms)">
          <TextArea
            rows={4}
            value={data.extras.backend ?? ""}
            onChange={(e) => setExtra("backend", e.target.value)}
            placeholder="Termos sem repetição, separados por espaço"
          />
        </Field>
        <Field label="Palavras de SEO">
          <TextArea rows={3} value={data.seo} onChange={(e) => setField("seo", e.target.value)} />
        </Field>
        <Field label="Estratégias / observações">
          <TextArea
            rows={4}
            value={data.strategies}
            onChange={(e) => setField("strategies", e.target.value)}
          />
        </Field>
        <Field label="Notas internas">
          <TextArea rows={3} value={data.notes} onChange={(e) => setField("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

export function TikTokTab({ product }: { product: Product }) {
  const { data, setField, setExtra } = useMarketplaceFields({ product, mkKey: "tiktok" });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-5 flex flex-col gap-4">
        <SectionTitle>Roteiro viral</SectionTitle>
        <Field label="Hook (gancho inicial)">
          <TextArea
            rows={3}
            value={data.extras.hook ?? ""}
            onChange={(e) => setExtra("hook", e.target.value)}
            placeholder='"Você ainda usa..."'
          />
        </Field>
        <Field label="Roteiro completo">
          <TextArea
            rows={10}
            value={data.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
        <Field label="CTA (chamada para ação)">
          <TextArea
            rows={2}
            value={data.extras.cta ?? ""}
            onChange={(e) => setExtra("cta", e.target.value)}
          />
        </Field>
      </div>
      <div className="panel p-5 flex flex-col gap-4">
        <SectionTitle>Produção & Estratégia</SectionTitle>
        <Field label="Áudio de referência">
          <TextInput
            value={data.extras.audio ?? ""}
            onChange={(e) => setExtra("audio", e.target.value)}
            placeholder="Link ou nome do áudio"
          />
        </Field>
        <Field label="Notas de edição">
          <TextArea
            rows={4}
            value={data.extras.editing ?? ""}
            onChange={(e) => setExtra("editing", e.target.value)}
          />
        </Field>
        <Field label="Estrutura viral">
          <TextArea
            rows={4}
            value={data.strategies}
            onChange={(e) => setField("strategies", e.target.value)}
          />
        </Field>
        <Field label="Estratégia de retenção">
          <TextArea
            rows={3}
            value={data.extras.retention ?? ""}
            onChange={(e) => setExtra("retention", e.target.value)}
          />
        </Field>
        <Field label="Links de vídeos de concorrentes">
          <TextArea
            rows={3}
            value={data.extras.competitorLinks ?? ""}
            onChange={(e) => setExtra("competitorLinks", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
