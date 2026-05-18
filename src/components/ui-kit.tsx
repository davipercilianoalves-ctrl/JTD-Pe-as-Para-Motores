import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:bg-input/70 focus:ring-2 focus:ring-ring/30",
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-md border border-border bg-input/40 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:bg-input/70 focus:ring-2 focus:ring-ring/30 resize-y",
        props.className,
      )}
    />
  );
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="number" step="0.01" {...props} />;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
      {action}
    </div>
  );
}
