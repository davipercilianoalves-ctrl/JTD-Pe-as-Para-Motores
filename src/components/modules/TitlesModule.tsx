import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product, TitleEntry, TitleVariant } from "@/lib/types";
import { TextInput } from "@/components/ui-kit";
import { ModuleShell } from "./ModuleShell";
import { cn } from "@/lib/utils";

type MK = "mercadoLivre" | "shopee" | "amazon" | "tiktok";

const MARKETS: { key: MK; label: string }[] = [
  { key: "mercadoLivre", label: "Mercado Livre" },
  { key: "shopee", label: "Shopee" },
  { key: "amazon", label: "Amazon" },
  { key: "tiktok", label: "TikTok" },
];

const VARIANTS: TitleVariant[] = ["SEO Forte", "Conversão", "Mobile", "Curto", "Completo"];

export function TitlesModule({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [market, setMarket] = useState<MK>("mercadoLivre");
  const data = product[market];

  const allTitles = MARKETS.flatMap((m) => product[m.key].titles);

  const addTitle = (variant: TitleVariant) => {
    const entry: TitleEntry = { id: crypto.randomUUID(), variant, text: "" };
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: { ...p[market], titles: [...p[market].titles, entry] },
    }));
  };

  const updateTitle = (id: string, text: string) =>
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: {
        ...p[market],
        titles: p[market].titles.map((t) => (t.id === id ? { ...t, text } : t)),
      },
    }));

  const removeTitle = (id: string) =>
    updateProduct(product.id, (p) => ({
      ...p,
      [market]: { ...p[market], titles: p[market].titles.filter((t) => t.id !== id) },
    }));

  return (
    <ModuleShell
      moduleKey="titles"
      title="Títulos & SEO"
      count={allTitles.length}
      summary={data.titles[0]?.text || "Crie variações de títulos por marketplace"}
    >
      <div className="flex gap-1 mb-6 border-b border-border">
        {MARKETS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMarket(m.key)}
            className={cn(
              "px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors",
              market === m.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label} ({product[m.key].titles.length})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {VARIANTS.map((v) => (
          <button
            key={v}
            onClick={() => addTitle(v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm hover:bg-accent/70"
          >
            <Plus className="h-3.5 w-3.5" /> {v}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {data.titles.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            Sem títulos para {MARKETS.find((m) => m.key === market)?.label} ainda
          </div>
        )}
        {data.titles.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-border bg-background/40 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {t.variant}
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    t.text.length > 60 ? "text-warning" : "text-muted-foreground",
                  )}
                >
                  {t.text.length}/60
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(t.text)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeTitle(t.id)}
                  className="text-destructive opacity-70 hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <TextInput
              value={t.text}
              onChange={(e) => updateTitle(t.id, e.target.value)}
              placeholder="Digite o título..."
              className="text-base"
            />
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}
