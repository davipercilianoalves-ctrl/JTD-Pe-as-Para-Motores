import { useRef, useState } from "react";
import { Star, Trash2, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { TextArea, SectionTitle } from "@/components/ui-kit";

export function ImagesTab({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const ingest = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newImgs = await Promise.all(
      arr.map(
        (f) =>
          new Promise<{ id: string; dataUrl: string; name: string; favorite: boolean; notes: string }>(
            (resolve) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  id: crypto.randomUUID(),
                  dataUrl: reader.result as string,
                  name: f.name,
                  favorite: false,
                  notes: "",
                });
              reader.readAsDataURL(f);
            },
          ),
      ),
    );
    updateProduct(product.id, (p) => ({ ...p, images: [...p.images, ...newImgs] }));
  };

  const active = product.images.find((i) => i.id === activeId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel p-5">
        <SectionTitle
          action={
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
          }
        >
          Galeria de imagens
        </SectionTitle>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && ingest(e.target.files)}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files.length) ingest(e.dataTransfer.files);
          }}
          className={`mb-4 rounded-md border-2 border-dashed py-8 text-center text-sm transition-colors ${
            drag ? "border-primary bg-primary/10" : "border-border text-muted-foreground"
          }`}
        >
          Arraste imagens aqui ou clique em Upload
        </div>

        {product.images.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">
            Nenhuma imagem adicionada
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {product.images.map((img) => (
              <div
                key={img.id}
                onClick={() => setActiveId(img.id)}
                className={`group relative overflow-hidden rounded-md border bg-background cursor-pointer transition-all ${
                  activeId === img.id ? "border-primary ring-2 ring-primary/40" : "border-border"
                }`}
              >
                <img src={img.dataUrl} alt={img.name} className="aspect-square w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateProduct(product.id, (p) => ({
                        ...p,
                        images: p.images.map((x) =>
                          x.id === img.id ? { ...x, favorite: !x.favorite } : x,
                        ),
                      }));
                    }}
                    className="rounded bg-black/50 p-1"
                  >
                    <Star
                      className={`h-3 w-3 ${img.favorite ? "fill-warning text-warning" : "text-white"}`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateProduct(product.id, (p) => ({
                        ...p,
                        images: p.images.filter((x) => x.id !== img.id),
                      }));
                    }}
                    className="rounded bg-black/50 p-1 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1 right-1 truncate text-[10px] text-white opacity-0 group-hover:opacity-100">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-elevated p-5 h-fit">
        <SectionTitle>Detalhes</SectionTitle>
        {active ? (
          <div className="flex flex-col gap-3">
            <img
              src={active.dataUrl}
              alt={active.name}
              className="w-full rounded-md border border-border"
            />
            <div className="text-xs text-muted-foreground truncate">{active.name}</div>
            <TextArea
              rows={5}
              placeholder="Notas sobre esta imagem..."
              value={active.notes}
              onChange={(e) =>
                updateProduct(product.id, (p) => ({
                  ...p,
                  images: p.images.map((x) =>
                    x.id === active.id ? { ...x, notes: e.target.value } : x,
                  ),
                }))
              }
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-6">
            Selecione uma imagem para ver detalhes
          </div>
        )}
      </div>
    </div>
  );
}
