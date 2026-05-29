import { useMemo, useState } from "react";
import {
  brl,
  type PricingData,
  type MarketplaceId,
  type Product,
} from "@/lib/types";
import { useStore } from "@/lib/store";
import { SectionTitle, TextInput, Btn } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export function PricingSection({ product, market }: { product: Product; market: MarketplaceId }) {
  const { updateProduct } = useStore();
  const p = product[market].pricing ?? {
    productCost: 0,
    marketplaceFee: 0,
    marketplaceFeeType: "%",
    shipping: 0,
    shippingType: "R$",
    packaging: 0,
    packagingType: "R$",
    transport: 0,
    transportType: "R$",
    tax: 0,
    taxType: "%",
    calcMode: "price",
    salePrice: 0,
    desiredProfit: 0,
    desiredMargin: 0,
    fakeDiscountPercent: 0,
  };

  const set = (patch: Partial<PricingData>) =>
    updateProduct(product.id, (prod) => ({
      ...prod,
      [market]: { ...prod[market], pricing: { ...p, ...patch } },
    }));

  const totalCosts = useMemo(() => {
    const getVal = (v: number, type: "R$" | "%", base: number) =>
      type === "R$" ? v : (v / 100) * base;
    
    const cost = p.productCost;
    const fee = getVal(p.marketplaceFee, p.marketplaceFeeType, p.salePrice);
    const ship = getVal(p.shipping, p.shippingType, p.salePrice);
    const pack = getVal(p.packaging, p.packagingType, p.salePrice);
    const trans = getVal(p.transport, p.transportType, p.salePrice);
    const tax = getVal(p.tax, p.taxType, p.salePrice);
    
    return { cost, fee, ship, pack, trans, tax, sum: cost + fee + ship + pack + trans + tax };
  }, [p]);

  const profit = p.salePrice - totalCosts.sum;
  const margin = p.salePrice > 0 ? (profit / p.salePrice) * 100 : 0;

  const marketPrices = product.competitors.map((c) => c.price).filter((v): v is number => !!v);
  const minMarket = marketPrices.length ? Math.min(...marketPrices) : 0;
  const avgMarket = marketPrices.length ? marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length : 0;

  return (
    <section className="space-y-8">
      <SectionTitle hint="Precificação estratégica com cálculo reverso.">Precificação</SectionTitle>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <CostInput label="Custo produto" val={p.productCost} type="R$" onChange={(v) => set({ productCost: v })} />
            <CostInput label="Taxa Mkt" val={p.marketplaceFee} type={p.marketplaceFeeType} onChange={(v, t) => set({ marketplaceFee: v, marketplaceFeeType: t })} />
            <CostInput label="Frete" val={p.shipping} type={p.shippingType} onChange={(v, t) => set({ shipping: v, shippingType: t })} />
            <CostInput label="Embalagem" val={p.packaging} type={p.packagingType} onChange={(v, t) => set({ packaging: v, packagingType: t })} />
            <CostInput label="Transporte" val={p.transport} type={p.transportType} onChange={(v, t) => set({ transport: v, transportType: t })} />
            <CostInput label="Imposto" val={p.tax} type={p.taxType} onChange={(v, t) => set({ tax: v, taxType: t })} />
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex gap-2 mb-4">
              {(["price", "profit", "margin"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => set({ calcMode: m })}
                  className={cn("flex-1 py-2 text-xs font-medium rounded-lg border", p.calcMode === m ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border")}
                >
                  {m === "price" ? "Definir Preço" : m === "profit" ? "Definir Lucro" : "Definir Margem"}
                </button>
              ))}
            </div>
            {p.calcMode === "price" && <TextInput type="number" label="Preço de Venda (R$)" value={p.salePrice} onChange={(e) => set({ salePrice: +e.target.value })} />}
            {p.calcMode === "profit" && <TextInput type="number" label="Lucro Desejado (R$)" value={p.desiredProfit} onChange={(e) => set({ desiredProfit: +e.target.value })} />}
            {p.calcMode === "margin" && <TextInput type="number" label="Margem Desejada (%)" value={p.desiredMargin} onChange={(e) => set({ desiredMargin: +e.target.value })} />}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Breakdown</div>
            <div className="space-y-2 text-sm">
              <Row label="Preço de venda" val={p.salePrice} />
              <Row label="Custo produto" val={totalCosts.cost} pct={margin} />
              <Row label="Taxa Mkt" val={totalCosts.fee} pct={(totalCosts.fee / p.salePrice) * 100} />
              <Row label="Frete" val={totalCosts.ship} pct={(totalCosts.ship / p.salePrice) * 100} />
              <Row label="Embalagem" val={totalCosts.pack} pct={(totalCosts.pack / p.salePrice) * 100} />
              <Row label="Transporte" val={totalCosts.trans} pct={(totalCosts.trans / p.salePrice) * 100} />
              <Row label="Imposto" val={totalCosts.tax} pct={(totalCosts.tax / p.salePrice) * 100} />
              <div className="border-t border-border pt-2 mt-2 font-bold flex justify-between">
                <span>Lucro líquido</span>
                <span className={profit >= 0 ? "text-success" : "text-destructive"}>{brl(profit)} ({margin.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {marketPrices.length > 0 && (
            <div className="p-4 rounded-xl bg-surface border border-border text-xs space-y-1">
              <div className="flex justify-between"><span>Mínimo mercado:</span> <span>{brl(minMarket)}</span></div>
              <div className="flex justify-between"><span>Médio mercado:</span> <span>{brl(avgMarket)}</span></div>
              <div className="flex justify-between font-bold">
                <span>Seu preço vs mercado:</span>
                <span className={p.salePrice < minMarket ? "text-success" : "text-warning"}>
                  {p.salePrice < minMarket ? "Abaixo ✓" : p.salePrice <= avgMarket ? "Na média" : "Acima ⚠"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CostInput({ label, val, type, onChange }: { label: string, val: number, type: "R$" | "%", onChange: (v: number, t: "R$" | "%") => void }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="flex gap-1">
        <input type="number" value={val} onChange={(e) => onChange(+e.target.value, type)} className="w-full bg-input/40 rounded-lg px-2 py-1.5 text-sm" />
        <button onClick={() => onChange(val, type === "R$" ? "%" : "R$")} className="px-2 bg-accent rounded-lg text-xs">{type}</button>
      </div>
    </div>
  );
}

function Row({ label, val, pct }: { label: string, val: number, pct?: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{brl(val)} {pct !== undefined && `(${pct.toFixed(1)}%)`}</span>
    </div>
  );
}
