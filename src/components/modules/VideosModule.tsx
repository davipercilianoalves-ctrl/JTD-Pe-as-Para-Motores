import { Plus, Trash2, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product, ProductVideo } from "@/lib/types";
import { Field, TextInput, TextArea, Btn } from "@/components/ui-kit";
import { ModuleShell } from "./ModuleShell";

export function VideosModule({ product }: { product: Product }) {
  const { updateProduct } = useStore();

  const add = () => {
    const v: ProductVideo = {
      id: crypto.randomUUID(),
      link: "",
      script: "",
      audio: "",
      description: "",
      cta: "",
      platform: "",
      editingNotes: "",
    };
    updateProduct(product.id, (p) => ({ ...p, videos: [v, ...p.videos] }));
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

  return (
    <ModuleShell
      moduleKey="videos"
      title="Vídeos"
      count={product.videos.length}
      summary={product.videos[0]?.platform || "Roteiros, áudios e CTAs"}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-muted-foreground">
          Roteiros, áudios e notas de edição
        </div>
        <Btn variant="primary" onClick={add}>
          <Plus className="h-4 w-4" /> Novo vídeo
        </Btn>
      </div>

      {product.videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Sem vídeos ainda
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {product.videos.map((v, i) => (
            <div
              key={v.id}
              className="rounded-2xl border border-border bg-background/40 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold text-muted-foreground">
                  Vídeo #{i + 1}
                </div>
                <button
                  onClick={() => rm(v.id)}
                  className="text-destructive opacity-70 hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Link externo">
                  <div className="flex gap-2">
                    <TextInput
                      value={v.link}
                      onChange={(e) => upd(v.id, { link: e.target.value })}
                      placeholder="https://..."
                    />
                    {v.link && (
                      <a
                        href={v.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-border px-3 hover:bg-accent"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </Field>
                <Field label="Plataforma">
                  <TextInput
                    value={v.platform}
                    onChange={(e) => upd(v.id, { platform: e.target.value })}
                  />
                </Field>
                <Field label="Áudio">
                  <TextInput
                    value={v.audio}
                    onChange={(e) => upd(v.id, { audio: e.target.value })}
                  />
                </Field>
                <Field label="CTA">
                  <TextInput value={v.cta} onChange={(e) => upd(v.id, { cta: e.target.value })} />
                </Field>
                <Field label="Roteiro" className="md:col-span-2">
                  <TextArea
                    rows={5}
                    value={v.script}
                    onChange={(e) => upd(v.id, { script: e.target.value })}
                  />
                </Field>
                <Field label="Descrição">
                  <TextArea
                    rows={3}
                    value={v.description}
                    onChange={(e) => upd(v.id, { description: e.target.value })}
                  />
                </Field>
                <Field label="Notas de edição">
                  <TextArea
                    rows={3}
                    value={v.editingNotes}
                    onChange={(e) => upd(v.id, { editingNotes: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}
