"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "loading";

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  id?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastRecord = ToastInput & {
  id: string;
  createdAt: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4500;

function variantStyles(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-emerald-500/30 bg-card";
    case "error":
      return "border-destructive/40 bg-card";
    case "warning":
      return "border-amber-500/35 bg-card";
    case "info":
      return "border-primary/25 bg-card";
    case "loading":
      return "border-border bg-card";
    default:
      return "border-border/80 bg-card";
  }
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = "size-5 shrink-0";
  switch (variant) {
    case "success":
      return <CheckCircle2 className={cn(className, "text-emerald-600 dark:text-emerald-400")} aria-hidden />;
    case "error":
      return <AlertCircle className={cn(className, "text-destructive")} aria-hidden />;
    case "warning":
      return <TriangleAlert className={cn(className, "text-amber-600 dark:text-amber-400")} aria-hidden />;
    case "loading":
      return <Loader2 className={cn(className, "animate-spin text-muted-foreground")} aria-hidden />;
    case "info":
      return <Info className={cn(className, "text-primary")} aria-hidden />;
    default:
      return <Info className={cn(className, "text-muted-foreground")} aria-hidden />;
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? crypto.randomUUID();
      const variant = input.variant ?? "default";
      const duration =
        input.duration ?? (variant === "loading" ? 120_000 : DEFAULT_DURATION);

      setToasts((prev) => {
        const without = prev.filter((t) => t.id !== id);
        return [
          ...without,
          {
            ...input,
            id,
            variant,
            createdAt: Date.now(),
          },
        ].slice(-5);
      });

      const existing = timersRef.current.get(id);
      if (existing !== undefined) {
        window.clearTimeout(existing);
      }
      if (duration > 0 && variant !== "loading") {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) =>
        toast({ title, description, variant: "success" }),
      error: (title, description) =>
        toast({ title, description, variant: "error", duration: 6000 }),
      warning: (title, description) =>
        toast({ title, description, variant: "warning", duration: 5500 }),
      info: (title, description) => toast({ title, description, variant: "info" }),
      loading: (title, description) =>
        toast({ title, description, variant: "loading", duration: 0 }),
    }),
    [dismiss, toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm gap-3 rounded-2xl border p-4 shadow-premium-lg ring-1 ring-border/40",
              "animate-in fade-in slide-in-from-bottom-4 duration-300",
              variantStyles(t.variant ?? "default"),
            )}
          >
            <ToastIcon variant={t.variant ?? "default"} />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-sm font-semibold leading-snug text-foreground">
                {t.title}
              </p>
              {t.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
              ) : null}
              {t.action ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto px-0 text-xs"
                  onClick={t.action.onClick}
                >
                  {t.action.label}
                </Button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function useOptionalToast() {
  return useContext(ToastContext);
}
