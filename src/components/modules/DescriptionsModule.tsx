import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Product, MarketplaceData } from "@/lib/types";
import { Field, TextArea } from "@/components/ui-kit";
import { ModuleShell } from "./ModuleShell";
import { cn } from "@/lib/utils";

type MK = "mercadoLivre" | "shopee" | "amazon" | "tiktok";
const MARKETS: { key: MK; label: string }[] = [
  { key: "mercadoLivre", label: "Mercado Livre" },
  { key: "shopee", label: "Shopee" },
  { key: "amazon", label: "Amazon" },
  { key: "tiktok", label: "TikTok" },
];

export function DescriptionsModule({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [market, setMarket] = useState<MK>("mercadoLivre");
  const data = product[market];

  const set = <K extends keyof MarketplaceData>(key: K, value: MarketplaceData[K]) =>
    updateProduct(product.id, (p) => ({ ...p, [market]: { ...p[market], [key]: value } }));

  const totalChars = MARKETS.reduce((s, m) => s + product[m.key].description.length, 0);

  return (
    <ModuleShell
      moduleKey="descriptions"
      title="Descrições & estratégia"
      summary={data.description.slice(0, 80) || "Escreva descrições por marketplace"}
      count={totalChars > 0 ? Math.ceil(totalChars / 100) : 0}
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
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-7">
        <Field label="Descrição principal">
          <TextArea
            rows={14}
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            className="text-base leading-relaxed"
          />
        </Field>
        <div className="flex flex-col gap-6">
          <Field label="Palavras-chave de SEO">
            <TextArea rows={4} value={data.seo} onChange={(e) => set("seo", e.target.value)} />
          </Field>
          <Field label="Bullet points / ficha técnica">
            <TextArea
              rows={6}
              value={data.media}
              onChange={(e) => set("media", e.target.value)}
              placeholder="• Item 1&#10;• Item 2"
            />
          </Field>
          <Field label="Estratégia / copy viral">
            <TextArea
              rows={4}
              value={data.strategies}
              onChange={(e) => set("strategies", e.target.value)}
            />
          </Field>
          <Field label="Notas">
            <TextArea rows={3} value={data.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      </div>
    </ModuleShell>
  );
}
