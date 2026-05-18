import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Product, PricingData } from "@/lib/types";
import { Field, NumberInput, SectionTitle } from "@/components/ui-kit";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PricingTab({ product }: { product: Product }) {
  const { updateProduct } = useStore();
  const p = product.pricing;

  const set = (key: keyof PricingData, value: number) =>
    updateProduct(product.id, (prod) => ({ ...prod, pricing: { ...prod.pricing, [key]: value } }));

  const calc = useMemo(() => {
    const baseCost = p.cost + p.shipping + p.packaging;
    const finalPrice = baseCost * (1 + p.markup / 100);
    const discountedPrice = finalPrice * (1 - p.discount / 100);
    const feesValue = discountedPrice * ((p.marketplaceFee + p.commission + p.taxes) / 100);
    const netProfit = discountedPrice - baseCost - feesValue;
    const profitPct = discountedPrice > 0 ? (netProfit / discountedPrice) * 100 : 0;
    const minPrice = baseCost / (1 - (p.marketplaceFee + p.commission + p.taxes) / 100 || 1);
    const idealPrice = finalPrice;
    return { baseCost, finalPrice, discountedPrice, feesValue, netProfit, profitPct, minPrice, idealPrice };
  }, [p]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="panel p-5">
        <SectionTitle>Composição de custos e taxas</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Custo do produto (R$)">
            <NumberInput value={p.cost} onChange={(e) => set("cost", +e.target.value || 0)} />
          </Field>
          <Field label="Frete (R$)">
            <NumberInput value={p.shipping} onChange={(e) => set("shipping", +e.target.value || 0)} />
          </Field>
          <Field label="Embalagem (R$)">
            <NumberInput value={p.packaging} onChange={(e) => set("packaging", +e.target.value || 0)} />
          </Field>
          <Field label="Impostos (%)">
            <NumberInput value={p.taxes} onChange={(e) => set("taxes", +e.target.value || 0)} />
          </Field>
          <Field label="Taxa do marketplace (%)">
            <NumberInput
              value={p.marketplaceFee}
              onChange={(e) => set("marketplaceFee", +e.target.value || 0)}
            />
          </Field>
          <Field label="Comissão (%)">
            <NumberInput value={p.commission} onChange={(e) => set("commission", +e.target.value || 0)} />
          </Field>
          <Field label="Markup (%)">
            <NumberInput value={p.markup} onChange={(e) => set("markup", +e.target.value || 0)} />
          </Field>
          <Field label="Desconto promocional (%)">
            <NumberInput value={p.discount} onChange={(e) => set("discount", +e.target.value || 0)} />
          </Field>
        </div>
      </div>

      <div className="panel-elevated p-5 flex flex-col gap-3 h-fit sticky top-4">
        <SectionTitle>Resultado em tempo real</SectionTitle>

        <Metric label="Custo base" value={formatBRL(calc.baseCost)} />
        <Metric label="Taxas totais" value={formatBRL(calc.feesValue)} muted />

        <div className="my-1 h-px bg-border" />

        <Metric label="Preço mínimo" value={formatBRL(calc.minPrice)} muted />
        <Metric label="Preço ideal" value={formatBRL(calc.idealPrice)} />
        <Metric label="Preço final" value={formatBRL(calc.discountedPrice)} highlight />

        <div className="my-1 h-px bg-border" />

        <Metric
          label="Lucro líquido"
          value={formatBRL(calc.netProfit)}
          positive={calc.netProfit >= 0}
          negative={calc.netProfit < 0}
        />
        <Metric
          label="Margem"
          value={`${calc.profitPct.toFixed(2)}%`}
          positive={calc.profitPct >= 0}
          negative={calc.profitPct < 0}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
  muted,
  positive,
  negative,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? "text-primary text-base" : ""
        } ${muted ? "text-muted-foreground" : ""} ${positive ? "text-success" : ""} ${
          negative ? "text-destructive" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
