import { useMemo, useRef, useState } from "react";
import {
  Plus,
  GripVertical,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  Check,
  X,
  ChevronDown,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Percent,
  Tags,
  Link as LinkIcon,
  CheckSquare,
  List,
  Layers,
  StickyNote,
  ChevronsUpDown,
} from "lucide-react";
import { AutoTextArea, TextInput } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import {
  MARKETPLACE_LABELS,
  type CustomField,
  type CustomFieldKind,
  type CustomFieldWidth,
  type MarketplaceId,
} from "@/lib/types";

const MK_KEYS: MarketplaceId[] = ["mercadoLivre", "shopee", "amazon", "tiktok"];
const MK_SHORT: Record<MarketplaceId, string> = {
  mercadoLivre: "ML",
  shopee: "SH",
  amazon: "AMZ",
  tiktok: "TT",
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const KIND_META: Record<
  CustomFieldKind,
  { label: string; icon: typeof Type; placeholder: string; default: unknown }
> = {
  short: { label: "Texto curto", icon: Type, placeholder: "Digite...", default: "" },
  long: { label: "Texto longo", icon: AlignLeft, placeholder: "Escreva livremente...", default: "" },
  rich: { label: "Bloco grande", icon: Layers, placeholder: "Conteúdo extenso, descrições, scripts...", default: "" },
  number: { label: "Número", icon: Hash, placeholder: "0", default: "" },
  currency: { label: "Moeda (R$)", icon: DollarSign, placeholder: "0,00", default: "" },
  percent: { label: "Porcentagem", icon: Percent, placeholder: "0", default: "" },
  tags: { label: "Tags", icon: Tags, placeholder: "Digite e Enter", default: [] },
  url: { label: "Link / URL", icon: LinkIcon, placeholder: "https://...", default: "" },
  checkbox: { label: "Sim / Não", icon: CheckSquare, placeholder: "", default: false },
  select: { label: "Seleção", icon: ChevronsUpDown, placeholder: "Escolha...", default: "" },
  bullets: { label: "Bullets", icon: List, placeholder: "Um por linha\nOutro item\nMais um", default: "" },
  spec: { label: "Especificação", icon: Layers, placeholder: "Chave: valor (uma por linha)", default: "" },
  notes: { label: "Nota colada", icon: StickyNote, placeholder: "Pensamento rápido, ideia, observação...", default: "" },
};

const WIDTH_OPTIONS: CustomFieldWidth[] = [25, 50, 75, 100];
const WIDTH_TO_SPAN: Record<CustomFieldWidth, string> = {
  25: "md:col-span-3",
  50: "md:col-span-6",
  75: "md:col-span-9",
  100: "md:col-span-12",
};

export function CustomFieldsPanel({
  fields,
  onChange,
  title = "Campos custom",
  hint,
  currentMarket,
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  title?: string;
  hint?: string;
  /** When provided, only fields tagged with this marketplace (or untagged/global) are shown.
   *  When undefined or "all", every field is shown. New fields are auto-tagged with this market. */
  currentMarket?: MarketplaceId | "all";
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const dragId = useRef<string | null>(null);
  const overId = useRef<string | null>(null);
  const [, force] = useState(0);

  const effectiveMarket: MarketplaceId | "all" =
    showAll || !currentMarket ? "all" : currentMarket;

  const visibleFields = useMemo(() => {
    if (effectiveMarket === "all") return fields;
    return fields.filter(
      (f) =>
        !f.marketplaces ||
        f.marketplaces.length === 0 ||
        f.marketplaces.includes(effectiveMarket),
    );
  }, [fields, effectiveMarket]);

  const addField = (kind: CustomFieldKind) => {
    const meta = KIND_META[kind];
    const autoTag: MarketplaceId[] =
      currentMarket && currentMarket !== "all" && !showAll ? [currentMarket] : [];
    onChange([
      ...fields,
      {
        id: uid(),
        kind,
        label: meta.label,
        placeholder: meta.placeholder,
        width:
          kind === "short" || kind === "number" || kind === "currency" || kind === "percent" || kind === "url" || kind === "checkbox" || kind === "select"
            ? 50
            : 100,
        value: meta.default,
        options: kind === "select" ? ["Opção 1", "Opção 2"] : undefined,
        marketplaces: autoTag,
      },
    ]);
    setAddOpen(false);
  };

  const update = (id: string, patch: Partial<CustomField>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));

  const duplicate = (id: string) => {
    const idx = fields.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const copy: CustomField = { ...fields[idx], id: uid(), label: fields[idx].label + " (cópia)" };
    onChange([...fields.slice(0, idx + 1), copy, ...fields.slice(idx + 1)]);
  };

  const reorder = () => {
    const from = dragId.current;
    const to = overId.current;
    if (!from || !to || from === to) return;
    const arr = [...fields];
    const fromIdx = arr.findIndex((f) => f.id === from);
    const toIdx = arr.findIndex((f) => f.id === to);
    if (fromIdx < 0 || toIdx < 0) return;
    const [m] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, m);
    onChange(arr);
    dragId.current = null;
    overId.current = null;
    force((n) => n + 1);
  };

  const focused = useMemo(
    () => (focusedId ? fields.find((f) => f.id === focusedId) ?? null : null),
    [focusedId, fields],
  );

  return (
    <section className="relative">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Workspace modular
          </div>
          <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          {hint && <p className="text-sm text-muted-foreground mt-1 max-w-xl">{hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          {currentMarket && currentMarket !== "all" && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                showAll
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              title={showAll ? "Filtrando: todos" : `Filtrando: ${MARKETPLACE_LABELS[currentMarket]} + globais`}
            >
              {showAll ? "Ver todos" : `Só ${MK_SHORT[currentMarket]} + globais`}
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Adicionar campo
            </button>
            {addOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setAddOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-40 w-72 rounded-xl border bg-popover shadow-2xl p-2 grid grid-cols-2 gap-1">
                  {(Object.keys(KIND_META) as CustomFieldKind[]).map((k) => {
                    const m = KIND_META[k];
                    const Icon = m.icon;
                    return (
                      <button
                        key={k}
                        onClick={() => addField(k)}
                        className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {visibleFields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {fields.length === 0
              ? "Nenhum campo ainda. Crie um campo do tipo que você precisar — texto, número, tags, link, bullets, etc."
              : "Nenhum campo deste marketplace ainda. Crie um — ele já entra marcado para o modo atual."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {visibleFields.map((f) => (
            <FieldCard
              key={f.id}
              field={f}
              onChange={(patch) => update(f.id, patch)}
              onRemove={() => remove(f.id)}
              onDuplicate={() => duplicate(f.id)}
              onFocus={() => setFocusedId(f.id)}
              onDragStart={() => (dragId.current = f.id)}
              onDragOver={(e) => {
                e.preventDefault();
                overId.current = f.id;
              }}
              onDrop={reorder}
              isDragOver={overId.current === f.id}
            />
          ))}
        </div>
      )}

      {focused && (
        <FocusOverlay
          field={focused}
          onChange={(patch) => update(focused.id, patch)}
          onClose={() => setFocusedId(null)}
        />
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function FieldCard({
  field,
  onChange,
  onRemove,
  onDuplicate,
  onFocus,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: {
  field: CustomField;
  onChange: (patch: Partial<CustomField>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onFocus: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragOver: boolean;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [widthMenu, setWidthMenu] = useState(false);

  return (
    <div
      className={cn(
        "group relative col-span-1 rounded-2xl border bg-card/50 hover:bg-card transition-colors px-5 pt-5 pb-4",
        WIDTH_TO_SPAN[field.width],
        isDragOver && "ring-2 ring-primary/60",
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Toolbar */}
      <div className="absolute -top-3 right-3 flex items-center gap-0.5 rounded-lg border bg-background shadow-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          draggable
          onDragStart={onDragStart}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setWidthMenu((v) => !v)}
            className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            title="Largura"
          >
            {field.width}% <ChevronDown className="h-2.5 w-2.5" />
          </button>
          {widthMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setWidthMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-30 rounded-md border bg-popover shadow-lg overflow-hidden">
                {WIDTH_OPTIONS.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      onChange({ width: w });
                      setWidthMenu(false);
                    }}
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-xs hover:bg-accent",
                      field.width === w && "text-primary font-medium",
                    )}
                  >
                    {w}%
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={onFocus}
          className="p-1 text-muted-foreground hover:text-foreground"
          title="Modo foco"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDuplicate}
          className="p-1 text-muted-foreground hover:text-foreground"
          title="Duplicar"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Remover "${field.label}"?`)) onRemove();
          }}
          className="p-1 text-muted-foreground hover:text-destructive"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Label */}
      <div className="mb-2 flex items-center gap-2">
        {editingLabel ? (
          <input
            autoFocus
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") setEditingLabel(false);
            }}
            className="bg-transparent text-[11px] uppercase tracking-[0.18em] text-foreground outline-none border-b border-primary/40 flex-1"
          />
        ) : (
          <button
            onClick={() => setEditingLabel(true)}
            className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground text-left truncate"
            title="Clique para renomear"
          >
            {field.label || "Sem nome"}
          </button>
        )}
      </div>

      <FieldEditor field={field} onChange={onChange} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function FieldEditor({
  field,
  onChange,
  big = false,
}: {
  field: CustomField;
  onChange: (patch: Partial<CustomField>) => void;
  big?: boolean;
}) {
  const ph = field.placeholder ?? KIND_META[field.kind].placeholder;
  const setValue = (v: unknown) => onChange({ value: v });

  switch (field.kind) {
    case "short":
    case "url":
      return (
        <TextInput
          value={(field.value as string) ?? ""}
          onChange={(e) => setValue(e.target.value)}
          placeholder={ph}
          className={big ? "text-2xl py-3" : ""}
        />
      );
    case "long":
      return (
        <AutoTextArea
          value={(field.value as string) ?? ""}
          onChange={(e) => setValue(e.target.value)}
          placeholder={ph}
          minRows={big ? 8 : 3}
          className={big ? "text-lg" : ""}
        />
      );
    case "rich":
    case "bullets":
    case "spec":
    case "notes":
      return (
        <AutoTextArea
          value={(field.value as string) ?? ""}
          onChange={(e) => setValue(e.target.value)}
          placeholder={ph}
          minRows={big ? 14 : 5}
          className={cn(
            big ? "text-lg" : "",
            field.kind === "notes" && "rounded-lg bg-warning/10 px-3 py-2",
            field.kind === "spec" && "font-mono text-sm",
          )}
        />
      );
    case "number":
    case "currency":
    case "percent":
      return (
        <div className="flex items-center gap-2">
          {field.kind === "currency" && <span className="text-muted-foreground">R$</span>}
          <TextInput
            type="number"
            step="0.01"
            value={(field.value as string) ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder={ph}
            className={big ? "text-3xl py-3 font-semibold" : ""}
          />
          {field.kind === "percent" && <span className="text-muted-foreground">%</span>}
        </div>
      );
    case "checkbox":
      return (
        <button
          onClick={() => setValue(!field.value)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
            field.value
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded border",
              field.value ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {field.value ? <Check className="h-3.5 w-3.5" /> : null}
          </span>
          {field.value ? "Sim" : "Não"}
        </button>
      );
    case "select":
      return <SelectEditor field={field} onChange={onChange} />;
    case "tags":
      return <TagsEditor field={field} onChange={onChange} />;
    default:
      return null;
  }
}

function SelectEditor({
  field,
  onChange,
}: {
  field: CustomField;
  onChange: (patch: Partial<CustomField>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const opts = field.options ?? [];
  if (editing) {
    return (
      <div className="space-y-2">
        <AutoTextArea
          value={opts.join("\n")}
          onChange={(e) => onChange({ options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
          placeholder={"Uma opção por linha"}
          minRows={3}
          className="text-sm"
        />
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-primary hover:underline"
        >
          Pronto
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <select
        value={(field.value as string) ?? ""}
        onChange={(e) => onChange({ value: e.target.value })}
        className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      >
        <option value="">— escolher —</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        editar opções
      </button>
    </div>
  );
}

function TagsEditor({
  field,
  onChange,
}: {
  field: CustomField;
  onChange: (patch: Partial<CustomField>) => void;
}) {
  const tags = (field.value as string[]) ?? [];
  const [input, setInput] = useState("");
  const commit = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    onChange({ value: [...tags, t] });
    setInput("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] rounded-lg border bg-background px-2.5 py-2 focus-within:ring-2 focus-within:ring-ring/40">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs"
        >
          {t}
          <button
            onClick={() =>
              onChange({ value: tags.filter((x) => x !== t) })
            }
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(input);
          } else if (e.key === "Backspace" && !input && tags.length) {
            onChange({ value: tags.slice(0, -1) });
          }
        }}
        onBlur={() => commit(input)}
        placeholder={field.placeholder ?? "Tag + Enter"}
        className="flex-1 min-w-[8ch] bg-transparent text-sm outline-none placeholder:text-muted-foreground/45"
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function FocusOverlay({
  field,
  onChange,
  onClose,
}: {
  field: CustomField;
  onChange: (patch: Partial<CustomField>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-start justify-center overflow-auto py-16 px-8">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Modo foco · {KIND_META[field.kind].label}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Minimize2 className="h-4 w-4" /> Sair
          </button>
        </div>
        <input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none mb-6"
        />
        <FieldEditor field={field} onChange={onChange} big />
      </div>
    </div>
  );
}
