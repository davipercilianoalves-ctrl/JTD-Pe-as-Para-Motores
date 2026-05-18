import type { InputHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from "react";
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
    <label className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
      )}
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-input/40 px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:bg-input/70 focus:ring-2 focus:ring-ring/30",
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
        "w-full rounded-lg border border-border bg-input/40 px-4 py-3 text-base leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:bg-input/70 focus:ring-2 focus:ring-ring/30 resize-y",
        props.className,
      )}
    />
  );
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="number" step="0.01" {...props} />;
}

export function Btn({
  variant = "ghost",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:opacity-90",
    ghost:
      "bg-transparent text-foreground hover:bg-accent",
    soft: "bg-accent text-foreground hover:bg-accent/80",
    danger:
      "bg-transparent text-destructive hover:bg-destructive/10",
  };
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
    />
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-semibold tracking-tight">{children}</h3>
      {action}
    </div>
  );
}
