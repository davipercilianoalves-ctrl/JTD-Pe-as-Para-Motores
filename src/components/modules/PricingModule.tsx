import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Product, PricingData } from "@/lib/types";
import { Field, NumberInput } from "@/components/ui-kit";
import { ModuleShell } from "./ModuleShell";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function psych(v: number) {
  if (v <= 0) return 0;
  const base = Math.floor(v);
  return base + (v < 100 ? 0.9 : 0.99);
}

export function PricingModule({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const p = product.pricing;

  const set = (key: keyof PricingData, value: number) =>
    updateProduct(product.id, (prod) => ({
      ...prod,
      pricing: { ...prod.pricing, [key]: value },
    }));

  const calc = useMemo(() => {
    const baseCost = p.cost + p.shipping + p.packaging + p.ads;
    const feesPct = p.marketplaceFee + p.commission + p.taxes;
    const finalPrice = baseCost * (1 + p.markup / 100);
    const discounted = finalPrice * (1 - p.discount / 100);
    const aggressive = finalPrice * (1 - p.maxDiscount / 100);
    const fees = discounted * (feesPct / 100);
    const net = discounted - baseCost - fees;
    const marginPct = discounted > 0 ? (net / discounted) * 100 : 0;
    const minPrice = baseCost / Math.max(1 - feesPct / 100, 0.01);
    const idealPrice = finalPrice;
    const psychPrice = psych(finalPrice);
    return {
      baseCost,
      feesPct,
      fees,
      finalPrice,
      discounted,
      aggressive,
      net,
      marginPct,
      minPrice,
      idealPrice,
      psychPrice,
    };
  }, [p]);

  return (
    <ModuleShell
      moduleKey="pricing"
      title="Precificação"
      summary={`Preço final ${brl(calc.discounted)} · Margem ${calc.marginPct.toFixed(1)}%`}
    >
      <div className="grid lg:grid-cols-[1.2fr_1fr_1fr] gap-6">
        {/* COSTS */}
        <Card title="Custos">
          <Field label="Custo do produto">
            <NumberInput value={p.cost} onChange={(e) => set("cost", +e.target.value || 0)} />
          </Field>
          <Field label="Frete">
            <NumberInput
              value={p.shipping}
              onChange={(e) => set("shipping", +e.target.value || 0)}
            />
          </Field>
          <Field label="Embalagem">
            <NumberInput
              value={p.packaging}
              onChange={(e) => set("packaging", +e.target.value || 0)}
            />
          </Field>
          <Field label="Custo de anúncios (R$)">
            <NumberInput value={p.ads} onChange={(e) => set("ads", +e.target.value || 0)} />
          </Field>
          <Field label="Impostos (%)">
            <NumberInput value={p.taxes} onChange={(e) => set("taxes", +e.target.value || 0)} />
          </Field>
          <Field label="Taxa marketplace (%)">
            <NumberInput
              value={p.marketplaceFee}
              onChange={(e) => set("marketplaceFee", +e.target.value || 0)}
            />
          </Field>
          <Field label="Comissão (%)">
            <NumberInput
              value={p.commission}
              onChange={(e) => set("commission", +e.target.value || 0)}
            />
          </Field>
        </Card>

        {/* STRATEGY */}
        <Card title="Estratégia">
          <Field label="Markup (%)">
            <NumberInput value={p.markup} onChange={(e) => set("markup", +e.target.value || 0)} />
          </Field>
          <Field label="Desconto promocional (%)">
            <NumberInput
              value={p.discount}
              onChange={(e) => set("discount", +e.target.value || 0)}
            />
          </Field>
          <Field label="Desconto máximo (%)">
            <NumberInput
              value={p.maxDiscount}
              onChange={(e) => set("maxDiscount", +e.target.value || 0)}
            />
          </Field>

          <div className="mt-2 rounded-xl border border-border bg-background/40 p-4 space-y-2 text-sm">
            <Row label="Custo base total" value={brl(calc.baseCost)} muted />
            <Row label="Taxas totais (%)" value={`${calc.feesPct.toFixed(1)}%`} muted />
            <Row label="Taxas em R$" value={brl(calc.fees)} muted />
          </div>
        </Card>

        {/* RESULTS */}
        <Card title="Resultado" highlight>
          <Row label="Preço mínimo viável" value={brl(calc.minPrice)} muted />
          <Row label="Preço ideal" value={brl(calc.idealPrice)} />
          <Row label="Preço psicológico" value={brl(calc.psychPrice)} />
          <Row label="Preço final" value={brl(calc.discounted)} big />
          <Row label="Preço agressivo" value={brl(calc.aggressive)} warning />

          <div className="my-3 h-px bg-border" />

          <Row
            label="Lucro líquido"
            value={brl(calc.net)}
            positive={calc.net >= 0}
            negative={calc.net < 0}
            big
          />
          <Row
            label="Margem"
            value={`${calc.marginPct.toFixed(2)}%`}
            positive={calc.marginPct >= 0}
            negative={calc.marginPct < 0}
            big
          />
        </Card>
      </div>
    </ModuleShell>
  );
}

function Card({
  title,
  children,
  highlight,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col gap-4 ${
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-background/40"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.1em] font-semibold text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  big,
  positive,
  negative,
  warning,
}: {
  label: string;
  value: string;
  muted?: boolean;
  big?: boolean;
  positive?: boolean;
  negative?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums font-semibold ${big ? "text-xl" : "text-base"} ${
          muted ? "text-muted-foreground" : ""
        } ${positive ? "text-success" : ""} ${negative ? "text-destructive" : ""} ${
          warning ? "text-warning" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
