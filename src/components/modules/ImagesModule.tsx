import { useRef, useState } from "react";
import { Star, Trash2, Upload, Download, Copy } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { TextArea } from "@/components/ui-kit";
import { ModuleShell } from "./ModuleShell";

export function ImagesModule({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const ingest = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newImgs = await Promise.all(
      arr.map(
        (f) =>
          new Promise<{
            id: string;
            dataUrl: string;
            name: string;
            favorite: boolean;
            notes: string;
          }>((resolve) => {
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
          }),
      ),
    );
    updateProduct(product.id, (p) => ({ ...p, images: [...p.images, ...newImgs] }));
  };

  const active = product.images.find((i) => i.id === activeId) ?? null;

  return (
    <ModuleShell
      moduleKey="images"
      title="Imagens"
      count={product.images.length}
      summary={
        product.images.length > 0
          ? `${product.images.length} imagem(ns) · ${
              product.images.filter((i) => i.favorite).length
            } favoritas`
          : "Faça upload das imagens do produto"
      }
    >
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
        onClick={() => inputRef.current?.click()}
        className={`mb-6 rounded-2xl border-2 border-dashed py-14 text-center transition-colors cursor-pointer ${
          drag
            ? "border-primary bg-primary/10"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
        }`}
      >
        <Upload className="mx-auto h-7 w-7 mb-3" />
        <div className="text-base font-medium">Arraste imagens aqui</div>
        <div className="text-sm mt-1">ou clique para selecionar</div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-7">
        {product.images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            Sem imagens ainda
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {product.images.map((img) => (
              <div
                key={img.id}
                onClick={() => setActiveId(img.id)}
                className={`group relative overflow-hidden rounded-xl border bg-background cursor-pointer transition-all ${
                  activeId === img.id
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <IconBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      updateProduct(product.id, (p) => ({
                        ...p,
                        images: p.images.map((x) =>
                          x.id === img.id ? { ...x, favorite: !x.favorite } : x,
                        ),
                      }));
                    }}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        img.favorite ? "fill-warning text-warning" : "text-white"
                      }`}
                    />
                  </IconBtn>
                  <IconBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      updateProduct(product.id, (p) => ({
                        ...p,
                        images: p.images.filter((x) => x.id !== img.id),
                      }));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </IconBtn>
                </div>
                <div className="absolute bottom-2 left-2 right-2 truncate text-xs text-white opacity-0 group-hover:opacity-100">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <aside className="rounded-2xl border border-border bg-background/40 p-5 h-fit sticky top-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Detalhes
          </div>
          {active ? (
            <div className="flex flex-col gap-4">
              <img
                src={active.dataUrl}
                alt={active.name}
                className="w-full rounded-xl border border-border"
              />
              <div className="text-sm font-medium truncate">{active.name}</div>
              <div className="flex gap-2">
                <a
                  href={active.dataUrl}
                  download={active.name}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs hover:bg-accent/70"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(active.dataUrl)}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs hover:bg-accent/70"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar URL
                </button>
              </div>
              <TextArea
                rows={6}
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
            <div className="text-sm text-muted-foreground text-center py-10">
              Selecione uma imagem
            </div>
          )}
        </aside>
      </div>
    </ModuleShell>
  );
}

function IconBtn({
  onClick,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-md bg-black/60 p-1.5 backdrop-blur hover:bg-black/80"
    >
      {children}
    </button>
  );
}
