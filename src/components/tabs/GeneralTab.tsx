import { useState } from "react";
import { Copy, Plus, Star, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product, CompetitorBlock } from "@/lib/types";
import { Field, TextInput, TextArea, SectionTitle } from "@/components/ui-kit";

export function GeneralTab({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const [newKw, setNewKw] = useState("");
  const [kwQuery, setKwQuery] = useState("");

  const addKeyword = () => {
    const text = newKw.trim();
    if (!text) return;
    updateProduct(product.id, (p) => ({
      ...p,
      keywords: [{ id: crypto.randomUUID(), text, favorite: false, uses: 0 }, ...p.keywords],
    }));
    setNewKw("");
  };

  const copyKw = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    updateProduct(product.id, (p) => ({
      ...p,
      keywords: p.keywords.map((k) => (k.id === id ? { ...k, uses: k.uses + 1 } : k)),
    }));
  };

  const filteredKw = product.keywords.filter((k) =>
    k.text.toLowerCase().includes(kwQuery.toLowerCase()),
  );
  const favoriteKw = product.keywords.filter((k) => k.favorite);

  const addCompetitor = () => {
    const c: CompetitorBlock = {
      id: crypto.randomUUID(),
      link: "",
      title: "",
      description: "",
      notes: "",
      strongWords: "",
      marketplace: "Mercado Livre",
    };
    updateProduct(product.id, (p) => ({ ...p, competitors: [...p.competitors, c] }));
  };

  const updateCompetitor = (id: string, patch: Partial<CompetitorBlock>) => {
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: p.competitors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const removeCompetitor = (id: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: p.competitors.filter((c) => c.id !== id),
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Keywords */}
      <div className="panel p-5">
        <SectionTitle>Palavras-chave</SectionTitle>

        <div className="flex gap-2 mb-3">
          <TextInput
            placeholder="Digite uma palavra-chave..."
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          />
          <button
            onClick={addKeyword}
            className="flex items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        <TextInput
          placeholder="Buscar palavra-chave..."
          value={kwQuery}
          onChange={(e) => setKwQuery(e.target.value)}
          className="mb-3"
        />

        {favoriteKw.length > 0 && (
          <div className="mb-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Favoritas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {favoriteKw.map((k) => (
                <span
                  key={k.id}
                  className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning px-2.5 py-1 text-xs"
                >
                  {k.text}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-auto -mx-2 px-2">
          {filteredKw.length === 0 && (
            <div className="text-xs text-muted-foreground py-4 text-center">
              Nenhuma palavra-chave
            </div>
          )}
          {filteredKw.map((k) => (
            <div
              key={k.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50"
            >
              <button
                onClick={() =>
                  updateProduct(product.id, (p) => ({
                    ...p,
                    keywords: p.keywords.map((x) =>
                      x.id === k.id ? { ...x, favorite: !x.favorite } : x,
                    ),
                  }))
                }
              >
                <Star
                  className={`h-3.5 w-3.5 ${k.favorite ? "fill-warning text-warning" : "text-muted-foreground"}`}
                />
              </button>
              <span className="flex-1 text-sm">{k.text}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {k.uses}x
              </span>
              <button
                onClick={() => copyKw(k.text, k.id)}
                className="opacity-60 hover:opacity-100"
                title="Copiar"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  updateProduct(product.id, (p) => ({
                    ...p,
                    keywords: p.keywords.filter((x) => x.id !== k.id),
                  }))
                }
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Competitors */}
      <div className="panel p-5">
        <SectionTitle
          action={
            <button
              onClick={addCompetitor}
              className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium hover:bg-accent/80"
            >
              <Plus className="h-3.5 w-3.5" /> Novo concorrente
            </button>
          }
        >
          Análise de concorrentes
        </SectionTitle>

        <div className="flex flex-col gap-3 max-h-[640px] overflow-auto pr-1">
          {product.competitors.length === 0 && (
            <div className="text-xs text-muted-foreground py-6 text-center">
              Adicione blocos de concorrentes para analisar
            </div>
          )}
          {product.competitors.map((c, idx) => (
            <div key={c.id} className="rounded-md border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-muted-foreground">
                  Concorrente #{idx + 1}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={c.marketplace}
                    onChange={(e) => updateCompetitor(c.id, { marketplace: e.target.value })}
                    className="rounded-md border border-border bg-input/40 px-2 py-1 text-xs"
                  >
                    <option>Mercado Livre</option>
                    <option>Shopee</option>
                    <option>Amazon</option>
                    <option>TikTok Shop</option>
                  </select>
                  <button
                    onClick={() => removeCompetitor(c.id)}
                    className="text-destructive opacity-60 hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                <Field label="Link do anúncio">
                  <TextInput
                    value={c.link}
                    onChange={(e) => updateCompetitor(c.id, { link: e.target.value })}
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Título">
                  <TextInput
                    value={c.title}
                    onChange={(e) => updateCompetitor(c.id, { title: e.target.value })}
                  />
                </Field>
                <Field label="Descrição">
                  <TextArea
                    rows={2}
                    value={c.description}
                    onChange={(e) => updateCompetitor(c.id, { description: e.target.value })}
                  />
                </Field>
                <Field label="Palavras fortes encontradas">
                  <TextArea
                    rows={2}
                    value={c.strongWords}
                    onChange={(e) => updateCompetitor(c.id, { strongWords: e.target.value })}
                  />
                </Field>
                <Field label="Observações">
                  <TextArea
                    rows={2}
                    value={c.notes}
                    onChange={(e) => updateCompetitor(c.id, { notes: e.target.value })}
                  />
                </Field>
                <div className="flex justify-end">
                  <button
                    onClick={() => navigator.clipboard.writeText(c.strongWords)}
                    className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs hover:bg-accent/80"
                  >
                    <Copy className="h-3 w-3" /> Copiar palavras
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
