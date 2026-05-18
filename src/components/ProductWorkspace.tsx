import { Star, Trash2 } from "lucide-react";
import { useStore, useSelectedProduct } from "@/lib/store";
import { Field, TextInput } from "@/components/ui-kit";
import { KeywordsModule } from "@/components/modules/KeywordsModule";
import { CompetitorsModule } from "@/components/modules/CompetitorsModule";
import { TitlesModule } from "@/components/modules/TitlesModule";
import { DescriptionsModule } from "@/components/modules/DescriptionsModule";
import { PricingModule } from "@/components/modules/PricingModule";
import { ImagesModule } from "@/components/modules/ImagesModule";
import { VideosModule } from "@/components/modules/VideosModule";
import { cn } from "@/lib/utils";

export function ProductWorkspace() {
  const product = useSelectedProduct();
  const { updateProduct, toggleFavorite, deleteProduct, goHome } = useStore();

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

  const set = <K extends keyof typeof product>(key: K, value: (typeof product)[K]) =>
    updateProduct(product.id, { [key]: value } as Partial<typeof product>);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-10 py-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-8">
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Workspace de produto
              </div>
              <input
                value={product.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nome do produto"
                className="w-full bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
              />
              <div className="text-sm text-muted-foreground mt-2">
                Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")} ·
                Atualizado {new Date(product.updatedAt).toLocaleString("pt-BR")} ·
                <span className="text-success ml-1">salvo automaticamente</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(product.id)}
                className="rounded-lg border border-border p-2.5 hover:bg-accent"
                title="Favoritar"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    product.favorite && "fill-warning text-warning",
                  )}
                />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Excluir "${product.name}"?`)) deleteProduct(product.id);
                }}
                className="rounded-lg border border-border p-2.5 text-destructive hover:bg-destructive/10"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Meta fields */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
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
              <TextInput
                value={product.brand}
                onChange={(e) => set("brand", e.target.value)}
              />
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
              <TextInput
                value={product.internalNotes}
                onChange={(e) => set("internalNotes", e.target.value)}
              />
            </Field>
          </div>

          {/* Modules */}
          <div className="flex flex-col gap-4">
            <KeywordsModule product={product} />
            <CompetitorsModule product={product} />
            <TitlesModule product={product} />
            <DescriptionsModule product={product} />
            <PricingModule product={product} />
            <ImagesModule product={product} />
            <VideosModule product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
