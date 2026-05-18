import { Plus, Search, Film, FolderOpen, Clock, Star, Package2, FileText } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import logoUrl from "@/assets/jtd-logo.png";

export function HomeScreen() {
  const { products, viralLibrary, createProduct, openProduct, openViral } = useStore();

  const recent = useMemo(
    () => [...products].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6),
    [products],
  );

  const continueWorking = recent[0] ?? null;

  const recentAnalyses = useMemo(() => {
    const all = products.flatMap((p) =>
      p.competitors.map((c) => ({ product: p, comp: c })),
    );
    return all.sort((a, b) => b.comp.updatedAt - a.comp.updatedAt).slice(0, 5);
  }, [products]);

  const recentVideos = useMemo(() => {
    const all = products.flatMap((p) => p.videos.map((v) => ({ product: p, v })));
    return all.slice(0, 5);
  }, [products]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl px-10 py-14">
        {/* Header */}
        <div className="mb-12">
          <div className="text-sm text-muted-foreground mb-2">JTD Motors Hub</div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Bem-vindo de volta.
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Seu centro de operações de ecommerce — produtos, análise, mídias e estratégia.
          </p>
        </div>

        {/* Continue working */}
        {continueWorking && (
          <section className="mb-12">
            <SectionLabel icon={Clock}>Continuar trabalhando</SectionLabel>
            <button
              onClick={() => openProduct(continueWorking.id)}
              className="group block w-full text-left rounded-2xl border border-border bg-surface hover:bg-surface-elevated transition-colors p-8"
            >
              <div className="flex items-center justify-between gap-6">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Último produto editado
                  </div>
                  <div className="text-2xl font-semibold truncate">
                    {continueWorking.name || "Sem nome"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1.5">
                    {continueWorking.brand || "Sem marca"} ·{" "}
                    {new Date(continueWorking.updatedAt).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground opacity-90 group-hover:opacity-100">
                  Abrir workspace →
                </div>
              </div>
            </button>
          </section>
        )}

        {/* Quick actions */}
        <section className="mb-12">
          <SectionLabel>Ações rápidas</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction icon={Plus} label="Novo Produto" onClick={() => createProduct()} />
            <QuickAction
              icon={Search}
              label="Nova Análise"
              onClick={() => {
                const id = createProduct();
                // analysis lives inside product, just opens product
                openProduct(id);
              }}
            />
            <QuickAction icon={Film} label="Biblioteca Viral" onClick={openViral} />
            <QuickAction
              icon={FolderOpen}
              label="Abrir Workspace"
              onClick={() => continueWorking && openProduct(continueWorking.id)}
              disabled={!continueWorking}
            />
          </div>
        </section>

        {/* Recent products */}
        <section className="mb-12">
          <SectionLabel icon={Package2}>Produtos recentes</SectionLabel>
          {recent.length === 0 ? (
            <EmptyHint>Crie seu primeiro produto para começar.</EmptyHint>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recent.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProduct(p.id)}
                  className="group text-left rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-colors p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <Package2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {p.favorite && <Star className="h-4 w-4 fill-warning text-warning" />}
                  </div>
                  <div className="font-medium truncate">{p.name || "Sem nome"}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {p.brand || "Sem marca"} · {p.competitors.length} análises
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Recent analyses */}
        <section className="mb-12">
          <SectionLabel icon={FileText}>Análises recentes</SectionLabel>
          {recentAnalyses.length === 0 ? (
            <EmptyHint>Suas análises de concorrentes aparecerão aqui.</EmptyHint>
          ) : (
            <div className="rounded-xl border border-border bg-surface divide-y divide-border">
              {recentAnalyses.map(({ product, comp }) => (
                <button
                  key={comp.id}
                  onClick={() => openProduct(product.id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 hover:bg-surface-elevated text-left transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {comp.title || "Análise sem título"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {product.name} · {comp.marketplace}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(comp.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Recent videos */}
        <section className="mb-12">
          <SectionLabel icon={Film}>Vídeos recentes</SectionLabel>
          {recentVideos.length === 0 && viralLibrary.length === 0 ? (
            <EmptyHint>Adicione vídeos ou clipes virais para reutilizar.</EmptyHint>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentVideos.map(({ product, v }) => (
                <button
                  key={v.id}
                  onClick={() => openProduct(product.id)}
                  className="text-left rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-colors p-5"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {v.platform || "Vídeo"}
                  </div>
                  <div className="font-medium truncate">
                    {v.cta || v.description.slice(0, 40) || "Sem título"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {product.name}
                  </div>
                </button>
              ))}
              {viralLibrary.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={openViral}
                  className="text-left rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-colors p-5"
                >
                  <div className="text-xs uppercase tracking-wider text-primary mb-1">
                    Viral · {c.platform}
                  </div>
                  <div className="font-medium truncate">{c.hook || "Sem hook"}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {c.views || "—"} views
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: typeof Clock;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-start gap-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:border-primary/40 transition-all p-6 disabled:opacity-40 disabled:cursor-not-allowed text-left"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-semibold">{label}</div>
    </button>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
