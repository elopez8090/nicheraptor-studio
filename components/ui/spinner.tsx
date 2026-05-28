import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("size-4 animate-spin text-current motion-reduce:animate-none", className)}
      role="status"
      aria-label={label}
    />
  );
}
