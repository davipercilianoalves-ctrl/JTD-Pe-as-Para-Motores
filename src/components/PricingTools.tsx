"use client";
import React, { useMemo } from "react";
import { AlertTriangle, Percent } from "lucide-react";
import { useStore } from "@/lib/store";
import { 
  type Product, 
  type PricingData, 
  emptyPricing 
} from "@/lib/types";
import { 
  computePricing, 
  brl 
} from "@/lib/pricing";
import { 
  SectionTitle, 
  Btn 
} from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
      {children}
    </div>
  );
}

export function PricingField({ 
  label, 
  value, 
  type, 
  onVal, 
  onType 
}: { 
  label: string; 
  value: number; 
  type: "R$" | "%"; 
  onVal: (v: any) => void; 
  onType: (t: "R$" | "%") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border/40">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onVal(e.target.value)}
          min={0}
          max={type === "%" ? 100 : undefined}
          className="w-20 bg-transparent text-right font-bold outline-none tabular-nums"
        />
        <button
          onClick={() => onType(type === "R$" ? "%" : "R$")}
          className="px-2 py-0.5 rounded bg-muted text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {type}
        </button>
      </div>
    </div>
  );
}

export function PricingSection({
  product,
  pricing: externalPricing,
  onUpdate: externalOnUpdate,
}: {
  product?: Product;
  pricing?: PricingData;
  onUpdate?: (patch: Partial<PricingData>) => void;
}) {
  const { updateProduct } = useStore();
  const p = externalPricing || (product?.pricing ?? emptyPricing());

  // Use optional chaining for p to avoid crashes if it becomes null during render
  const result = useMemo(() => p ? computePricing(p) : null, [p]);

  if (!p || !result) return null;

  const setVal = (key: keyof PricingData, val: any) => {
    const num = (v: any) => parseFloat(v) || 0;
    let safeValue = val;

    const percentFields: (keyof PricingData)[] = [
      "marketplaceFee", "shipping", "packaging", "transport", "tax", "fakeDiscountPercent"
    ];

    if (percentFields.includes(key)) {
      const typeKey = `${key}Type` as keyof PricingData;
      if (p[typeKey] === "%" || key === "fakeDiscountPercent") {
        const parsed = num(val);
        safeValue = Math.max(0, Math.min(100, parsed));
      }
    }

    if (key === "desiredMargin") {
      const parsed = num(val);
      safeValue = Math.max(0, Math.min(99, parsed));
    }

    if (externalOnUpdate) {
      externalOnUpdate({ [key]: safeValue });
      return;
    }

    if (!product) return;

    updateProduct(product.id, (prev) => {
      const prod = prev as Product;
      return {
        ...prod,
        pricing: { ...(prod.pricing ?? emptyPricing()), [key]: safeValue }
      };
    });
  };

  return (
    <section className="space-y-6">
      <SectionTitle hint="Estrutura de precificação dinâmica para o marketplace.">
        Precificação
      </SectionTitle>
      
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border/40">
          <SubLabel>Modo de Cálculo</SubLabel>
          <select 
            value={p.calcMode} 
            onChange={(e) => setVal("calcMode", e.target.value)}
            className="w-full bg-transparent font-bold text-lg outline-none"
          >
            <option value="price">Definir Preço</option>
            <option value="profit">Definir Lucro R$</option>
            <option value="margin">Definir Margem %</option>
          </select>
        </div>

        {p.calcMode === "price" && (
          <div className="bg-surface p-5 rounded-2xl border border-border/40">
            <SubLabel>Preço de Venda</SubLabel>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold">R$</span>
              <input
                type="number"
                value={p.salePrice || ""}
                onChange={(e) => setVal("salePrice", e.target.value)}
                className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
                placeholder="0,00"
              />
            </div>
          </div>
        )}

        {p.calcMode === "profit" && (
          <div className="bg-surface p-5 rounded-2xl border border-border/40">
            <SubLabel>Lucro Desejado (R$)</SubLabel>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold">R$</span>
              <input
                type="number"
                value={p.desiredProfit || ""}
                onChange={(e) => setVal("desiredProfit", e.target.value)}
                className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
                placeholder="0,00"
              />
            </div>
          </div>
        )}

        {p.calcMode === "margin" && (
          <div className="bg-surface p-5 rounded-2xl border border-border/40">
            <SubLabel>Margem Desejada (%)</SubLabel>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={p.desiredMargin || ""}
                onChange={(e) => setVal("desiredMargin", e.target.value)}
                min={0}
                max={99}
                className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
                placeholder="0"
              />
              <span className="text-xl font-bold">%</span>
            </div>
          </div>
        )}

        <div className="bg-surface p-5 rounded-2xl border border-border/40">
          <SubLabel>Custo de Produto</SubLabel>
          <div className="flex items-center gap-1">
            <span className="text-xl font-semibold">R$</span>
            <input
              type="number"
              value={p.productCost || ""}
              onChange={(e) => setVal("productCost", e.target.value)}
              className="text-2xl font-bold bg-transparent outline-none w-full tabular-nums"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4">
          <div className="bg-surface p-6 rounded-2xl border border-border/40">
             <SectionTitle hint="Configure as taxas e custos variáveis.">Custos e Taxas</SectionTitle>
             <div className="space-y-4 mt-4">
                <PricingField label="Taxa Marketplace" value={p.marketplaceFee} type={p.marketplaceFeeType} onVal={(v) => setVal("marketplaceFee", v)} onType={(t) => setVal("marketplaceFeeType", t)} />
                <PricingField label="Frete / Envio" value={p.shipping} type={p.shippingType} onVal={(v) => setVal("shipping", v)} onType={(t) => setVal("shippingType", t)} />
                <PricingField label="Embalagem" value={p.packaging} type={p.packagingType} onVal={(v) => setVal("packaging", v)} onType={(t) => setVal("packagingType", t)} />
                <PricingField label="Imposto" value={p.tax} type={p.taxType} onVal={(v) => setVal("tax", v)} onType={(t) => setVal("taxType", t)} />
             </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border/40">
            <SectionTitle hint="Markup para exibir desconto falso no marketplace.">Markup de Desconto (Preço "De")</SectionTitle>
            <div className="flex items-center gap-4 mt-4">
               <div className="flex-1">
                  <SubLabel>Desconto Desejado (%)</SubLabel>
                  <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border/40">
                    <input 
                      type="number" 
                      min={0} 
                      max={100} 
                      value={p.fakeDiscountPercent || ""} 
                      onChange={(e) => setVal("fakeDiscountPercent", e.target.value)}
                      className="w-full bg-transparent font-bold outline-none"
                    />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
               </div>
            </div>
            {Number(p.fakeDiscountPercent) > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço "de" (com markup):</span>
                  <span className="font-semibold">{brl(result.displayedPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto aplicado:</span>
                  <span className="text-success font-semibold">- {brl(result.displayedPrice - result.finalPrice)}</span>
                </div>
                <div className="flex justify-between border-t border-border/40 pt-2 mt-1">
                  <span className="font-medium">Preço "por" (final):</span>
                  <span className="font-bold">{brl(result.finalPrice)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface p-6 rounded-2xl border border-border/40 h-full">
            <SectionTitle hint="Resultado final após descontar todos os custos.">Resultado Líquido</SectionTitle>
            
            <div className="mt-6 space-y-6">
              <div>
                <SubLabel>Preço de Venda Final</SubLabel>
                <div className="text-3xl font-bold">{brl(result.finalPrice)}</div>
              </div>

              <div>
                <SubLabel>Lucro por Unidade</SubLabel>
                {result.netProfit < 0 ? (
                  <div className="flex items-center gap-2 text-red-500 font-bold text-2xl">
                    <AlertTriangle className="h-6 w-6" />
                    <span>Prejuízo: {brl(Math.abs(result.netProfit))}</span>
                  </div>
                ) : (
                  <div className="text-success font-bold text-2xl">
                    Lucro: {brl(result.netProfit)}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/40">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Margem Líquida:</span>
                  <span className={cn(
                    "text-xl font-bold",
                    result.marginPct < 0 ? "text-red-500" : "text-success"
                  )}>
                    {result.marginPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/20 overflow-hidden bg-background/50">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b border-border/20">
                    <tr>
                      <th className="px-3 py-2 text-left">Breakdown</th>
                      <th className="px-3 py-2 text-right">R$</th>
                      <th className="px-3 py-2 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((b) => (
                      <tr key={b.label} className="border-b border-border/10 last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{b.label}</td>
                        <td className="px-3 py-2 text-right font-medium">{brl(b.amount)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{b.pctOfFinal.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
