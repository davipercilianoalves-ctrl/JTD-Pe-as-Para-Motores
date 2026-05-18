import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { TextArea } from "@/components/ui-kit";
import { ModuleShell } from "./ModuleShell";

export function KeywordsModule({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [copied, setCopied] = useState(false);
  const text = product.keywordsText;
  const keywords = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const copyAll = () => {
    navigator.clipboard.writeText(keywords.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyOne = (kw: string) => {
    navigator.clipboard.writeText(kw);
  };

  return (
    <ModuleShell
      moduleKey="keywords"
      title="Palavras-chave"
      count={keywords.length}
      summary={keywords.slice(0, 6).join(" · ") || "Adicione palavras-chave para SEO"}
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">
              Uma palavra-chave por linha
            </div>
            <button
              onClick={copyAll}
              disabled={keywords.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar tudo"}
            </button>
          </div>
          <TextArea
            value={text}
            onChange={(e) => updateProduct(product.id, { keywordsText: e.target.value })}
            placeholder={"kit motor vw ap 1.6\njunta cabeçote\npistão forjado\n..."}
            rows={16}
            className="text-lg leading-relaxed font-mono"
          />
        </div>

        <div className="rounded-xl border border-border bg-background/40 p-5 max-h-[600px] overflow-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Lista rápida ({keywords.length})
          </div>
          {keywords.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma palavra ainda
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {keywords.map((kw, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent/60"
                >
                  <span className="text-sm truncate">{kw}</span>
                  <button
                    onClick={() => copyOne(kw)}
                    className="opacity-0 group-hover:opacity-70 hover:!opacity-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
