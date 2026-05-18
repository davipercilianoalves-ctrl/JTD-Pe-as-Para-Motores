import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product, ProductVideo, ViralClip } from "@/lib/types";
import { Field, TextInput, TextArea, SectionTitle } from "@/components/ui-kit";

export function VideosTab({ product }: { product: Product }) {
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
    updateProduct(product.id, (p) => ({ ...p, videos: [...p.videos, v] }));
  };

  const upd = (id: string, patch: Partial<ProductVideo>) => {
    updateProduct(product.id, (p) => ({
      ...p,
      videos: p.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  };

  const rm = (id: string) =>
    updateProduct(product.id, (p) => ({ ...p, videos: p.videos.filter((v) => v.id !== id) }));

  return (
    <div className="panel p-5">
      <SectionTitle
        action={
          <button
            onClick={add}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Novo vídeo
          </button>
        }
      >
        Vídeos do produto
      </SectionTitle>

      {product.videos.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-6">
          Nenhum vídeo cadastrado
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {product.videos.map((v, i) => (
          <div key={v.id} className="rounded-md border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-muted-foreground">Vídeo #{i + 1}</div>
              <button onClick={() => rm(v.id)} className="text-destructive opacity-60 hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-3">
              <Field label="Link / Plataforma">
                <TextInput
                  value={v.link}
                  onChange={(e) => upd(v.id, { link: e.target.value })}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Plataforma">
                <TextInput value={v.platform} onChange={(e) => upd(v.id, { platform: e.target.value })} />
              </Field>
              <Field label="Roteiro">
                <TextArea rows={3} value={v.script} onChange={(e) => upd(v.id, { script: e.target.value })} />
              </Field>
              <Field label="Áudio">
                <TextInput value={v.audio} onChange={(e) => upd(v.id, { audio: e.target.value })} />
              </Field>
              <Field label="Descrição">
                <TextArea
                  rows={2}
                  value={v.description}
                  onChange={(e) => upd(v.id, { description: e.target.value })}
                />
              </Field>
              <Field label="CTA">
                <TextInput value={v.cta} onChange={(e) => upd(v.id, { cta: e.target.value })} />
              </Field>
              <Field label="Notas de edição">
                <TextArea
                  rows={2}
                  value={v.editingNotes}
                  onChange={(e) => upd(v.id, { editingNotes: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ViralClipsTab({ product }: { product: Product }) {
  const { updateProduct } = useStore();

  const add = () => {
    const c: ViralClip = {
      id: crypto.randomUUID(),
      link: "",
      platform: "TikTok",
      views: "",
      hook: "",
      strategy: "",
      structure: "",
      audio: "",
      notes: "",
      editType: "",
    };
    updateProduct(product.id, (p) => ({ ...p, viralClips: [c, ...p.viralClips] }));
  };

  const upd = (id: string, patch: Partial<ViralClip>) =>
    updateProduct(product.id, (p) => ({
      ...p,
      viralClips: p.viralClips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const rm = (id: string) =>
    updateProduct(product.id, (p) => ({ ...p, viralClips: p.viralClips.filter((c) => c.id !== id) }));

  return (
    <div className="panel p-5">
      <SectionTitle
        action={
          <button
            onClick={add}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Novo clip
          </button>
        }
      >
        Biblioteca de clips virais
      </SectionTitle>

      {product.viralClips.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-6">
          Salve clips virais para reutilizar estratégias
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {product.viralClips.map((c) => (
          <div key={c.id} className="rounded-md border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <select
                value={c.platform}
                onChange={(e) => upd(c.id, { platform: e.target.value })}
                className="rounded-md border border-border bg-input/40 px-2 py-1 text-xs"
              >
                <option>TikTok</option>
                <option>Instagram</option>
                <option>YouTube Shorts</option>
                <option>Kwai</option>
              </select>
              <button onClick={() => rm(c.id)} className="text-destructive opacity-60 hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-2.5">
              <Field label="Link">
                <TextInput value={c.link} onChange={(e) => upd(c.id, { link: e.target.value })} />
              </Field>
              <Field label="Views">
                <TextInput value={c.views} onChange={(e) => upd(c.id, { views: e.target.value })} />
              </Field>
              <Field label="Hook usado">
                <TextArea rows={2} value={c.hook} onChange={(e) => upd(c.id, { hook: e.target.value })} />
              </Field>
              <Field label="Estratégia percebida">
                <TextArea
                  rows={2}
                  value={c.strategy}
                  onChange={(e) => upd(c.id, { strategy: e.target.value })}
                />
              </Field>
              <Field label="Estrutura do vídeo">
                <TextArea
                  rows={2}
                  value={c.structure}
                  onChange={(e) => upd(c.id, { structure: e.target.value })}
                />
              </Field>
              <Field label="Áudio">
                <TextInput value={c.audio} onChange={(e) => upd(c.id, { audio: e.target.value })} />
              </Field>
              <Field label="Tipo de edição">
                <TextInput value={c.editType} onChange={(e) => upd(c.id, { editType: e.target.value })} />
              </Field>
              <Field label="Observações">
                <TextArea rows={2} value={c.notes} onChange={(e) => upd(c.id, { notes: e.target.value })} />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
