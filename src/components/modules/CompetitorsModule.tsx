import { Plus, Trash2, ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product, CompetitorBlock } from "@/lib/types";
import { Field, TextInput, TextArea, Btn } from "@/components/ui-kit";
import { ModuleShell } from "./ModuleShell";

export function CompetitorsModule({ product }: { product: Product }) {
  const { updateProduct, ui, openCompetitor, focusModule } = useStore();

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
    openCompetitor(c.id);
    focusModule("competitors");
  };

  const update = (id: string, patch: Partial<CompetitorBlock>) => {
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: p.competitors.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
      ),
    }));
  };

  const remove = (id: string) => {
    updateProduct(product.id, (p) => ({
      ...p,
      competitors: p.competitors.filter((c) => c.id !== id),
    }));
    if (ui.openCompetitorId === id) openCompetitor(null);
  };

  const opened = product.competitors.find((c) => c.id === ui.openCompetitorId);

  // If a competitor is open in focus mode, render the editor inside the shell
  const editor = opened ? (
    <CompetitorEditor competitor={opened} onChange={(p) => update(opened.id, p)} onClose={() => openCompetitor(null)} />
  ) : (
    <CompetitorList
      product={product}
      onOpen={(id) => openCompetitor(id)}
      onRemove={remove}
      onAdd={add}
    />
  );

  return (
    <ModuleShell
      moduleKey="competitors"
      title="Análise de concorrentes"
      count={product.competitors.length}
      summary={
        product.competitors[0]?.title ||
        product.competitors[0]?.link ||
        "Crie blocos de pesquisa de concorrentes"
      }
    >
      {editor}
    </ModuleShell>
  );
}

function CompetitorList({
  product,
  onOpen,
  onRemove,
  onAdd,
}: {
  product: Product;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-muted-foreground">
          Clique em um concorrente para abrir o workspace de análise
        </div>
        <Btn variant="primary" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Novo concorrente
        </Btn>
      </div>

      {product.competitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Nenhum concorrente cadastrado ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {product.competitors.map((c) => (
            <div
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="group flex items-center gap-4 rounded-xl border border-border bg-background/40 hover:bg-surface-elevated px-6 py-5 cursor-pointer transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-muted-foreground">
                {c.marketplace.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {c.title || c.link || "Concorrente sem título"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {c.marketplace} · atualizado{" "}
                  {new Date(c.updatedAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Excluir este concorrente?")) onRemove(c.id);
                }}
                className="text-destructive opacity-0 group-hover:opacity-80 hover:!opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompetitorEditor({
  competitor,
  onChange,
  onClose,
}: {
  competitor: CompetitorBlock;
  onChange: (patch: Partial<CompetitorBlock>) => void;
  onClose: () => void;
}) {
  const c = competitor;
  const copy = (txt: string) => navigator.clipboard.writeText(txt);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à lista
        </button>
        <select
          value={c.marketplace}
          onChange={(e) => onChange({ marketplace: e.target.value })}
          className="rounded-lg border border-border bg-input/40 px-4 py-2.5 text-sm"
        >
          <option>Mercado Livre</option>
          <option>Shopee</option>
          <option>Amazon</option>
          <option>TikTok Shop</option>
        </select>
      </div>

      <div className="space-y-7">
        <Field label="Link do anúncio">
          <div className="flex gap-2">
            <TextInput
              value={c.link}
              onChange={(e) => onChange({ link: e.target.value })}
              placeholder="https://..."
            />
            {c.link && (
              <a
                href={c.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-border px-3 hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Field>

        <Field label="Título do concorrente">
          <TextInput
            value={c.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="text-lg"
          />
        </Field>

        <Field label="Descrição completa">
          <TextArea
            rows={10}
            value={c.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="text-base leading-relaxed"
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Palavras-chave encontradas
            </span>
            <button
              onClick={() => copy(c.strongWords)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
          </div>
          <TextArea
            rows={5}
            value={c.strongWords}
            onChange={(e) => onChange({ strongWords: e.target.value })}
            placeholder="Liste as palavras fortes que apareceram..."
          />
        </div>

        <Field label="Observações estratégicas">
          <TextArea
            rows={6}
            value={c.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="O que esse concorrente faz bem? O que dá para superar?"
          />
        </Field>
      </div>
    </div>
  );
}
