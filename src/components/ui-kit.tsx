import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
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
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
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
        "w-full rounded-lg bg-input/40 px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-input/70 focus:ring-2 focus:ring-ring/40",
        props.className,
      )}
    />
  );
}

/** Standard textarea (rarely used now — prefer AutoTextArea) */
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg bg-input/40 px-3.5 py-2.5 text-base leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-input/70 focus:ring-2 focus:ring-ring/40 resize-none",
        props.className,
      )}
    />
  );
}

/**
 * Auto-expanding textarea — grows with content, NEVER scrolls internally.
 * The page scrolls instead. Core to the continuous-flow workspace.
 */
export const AutoTextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }>(
  function AutoTextArea({ className, minRows = 2, value, onChange, ...rest }, ref) {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    };

    const resize = () => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    };

    useLayoutEffect(resize, [value]);
    useEffect(() => {
      resize();
      const onWinResize = () => resize();
      window.addEventListener("resize", onWinResize);
      return () => window.removeEventListener("resize", onWinResize);
    }, []);

    return (
      <textarea
        ref={setRefs}
        value={value}
        rows={minRows}
        onChange={(e) => {
          onChange?.(e);
          requestAnimationFrame(resize);
        }}
        {...rest}
        className={cn(
          "w-full bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground/45 resize-none overflow-hidden break-words [overflow-wrap:anywhere] whitespace-pre-wrap",
          className,
        )}
      />
    );
  },
);

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
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    ghost: "bg-transparent text-foreground hover:bg-accent",
    soft: "bg-accent text-foreground hover:bg-accent/80",
    danger: "bg-transparent text-destructive hover:bg-destructive/10",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-11 px-6 text-base",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
    />
  );
}

export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {children}
        </h2>
        {hint && <div className="text-sm text-muted-foreground/80 mt-1">{hint}</div>}
      </div>
      {action}
    </div>
  );
}
