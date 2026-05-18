import { Plus, Trash2, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { Field, TextInput, TextArea, Btn } from "@/components/ui-kit";

export function ViralLibraryScreen() {
  const { viralLibrary, addViral, updateViral, deleteViral } = useStore();

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl px-10 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Biblioteca global</div>
            <h1 className="text-3xl font-semibold tracking-tight">Clips Virais</h1>
            <p className="text-base text-muted-foreground mt-2">
              Banco de inspiração reutilizável. Salve hooks, estratégias e estruturas que
              funcionaram.
            </p>
          </div>
          <Btn variant="primary" size="lg" onClick={() => addViral()}>
            <Plus className="h-5 w-5" /> Novo clip
          </Btn>
        </div>

        {viralLibrary.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
            Sua biblioteca está vazia. Adicione clipes para reutilizar estratégias.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {viralLibrary.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-surface p-7"
              >
                <div className="flex items-center justify-between mb-5">
                  <select
                    value={c.platform}
                    onChange={(e) => updateViral(c.id, { platform: e.target.value })}
                    className="rounded-lg border border-border bg-input/40 px-4 py-2 text-sm font-medium"
                  >
                    <option>TikTok</option>
                    <option>Instagram</option>
                    <option>YouTube Shorts</option>
                    <option>Kwai</option>
                  </select>
                  <button
                    onClick={() => {
                      if (confirm("Excluir este clip?")) deleteViral(c.id);
                    }}
                    className="text-destructive opacity-70 hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Link">
                    <div className="flex gap-2">
                      <TextInput
                        value={c.link}
                        onChange={(e) => updateViral(c.id, { link: e.target.value })}
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
                  <Field label="Views">
                    <TextInput
                      value={c.views}
                      onChange={(e) => updateViral(c.id, { views: e.target.value })}
                      placeholder="ex: 1.2M"
                    />
                  </Field>
                  <Field label="Hook usado" className="md:col-span-2">
                    <TextArea
                      rows={3}
                      value={c.hook}
                      onChange={(e) => updateViral(c.id, { hook: e.target.value })}
                    />
                  </Field>
                  <Field label="Estratégia">
                    <TextArea
                      rows={3}
                      value={c.strategy}
                      onChange={(e) => updateViral(c.id, { strategy: e.target.value })}
                    />
                  </Field>
                  <Field label="Estrutura do vídeo">
                    <TextArea
                      rows={3}
                      value={c.structure}
                      onChange={(e) => updateViral(c.id, { structure: e.target.value })}
                    />
                  </Field>
                  <Field label="Áudio">
                    <TextInput
                      value={c.audio}
                      onChange={(e) => updateViral(c.id, { audio: e.target.value })}
                    />
                  </Field>
                  <Field label="Tipo de edição">
                    <TextInput
                      value={c.editType}
                      onChange={(e) => updateViral(c.id, { editType: e.target.value })}
                    />
                  </Field>
                  <Field label="Observações" className="md:col-span-2">
                    <TextArea
                      rows={3}
                      value={c.notes}
                      onChange={(e) => updateViral(c.id, { notes: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
