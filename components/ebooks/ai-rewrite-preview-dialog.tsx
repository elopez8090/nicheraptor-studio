"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AiRewritePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolLabel: string;
  originalText: string;
  resultText: string | null;
  loading: boolean;
  error: string | null;
  onReplace: () => void;
  onSaveToLibrary?: (content: string) => void;
};

export function AiRewritePreviewDialog({
  open,
  onOpenChange,
  toolLabel,
  originalText,
  resultText,
  loading,
  error,
  onReplace,
  onSaveToLibrary,
}: AiRewritePreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!resultText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [resultText]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCopied(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{toolLabel}</DialogTitle>
          <DialogDescription>
            Review the AI suggestion before replacing your selection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Original
            </p>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-border/80 bg-muted/30 p-3 text-sm leading-relaxed">
              {originalText}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggestion
            </p>
            <div
              className="min-h-[120px] max-h-48 overflow-y-auto rounded-lg border border-border/80 bg-card p-3 text-sm leading-relaxed"
              aria-live="polite"
            >
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Generating…
                </div>
              ) : error ? (
                <p className="text-destructive" role="alert">
                  {error}
                </p>
              ) : resultText ? (
                resultText
              ) : (
                <span className="text-muted-foreground">No result yet.</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          {onSaveToLibrary ? (
            <Button
              type="button"
              variant="secondary"
              disabled={!resultText || loading}
              onClick={() => {
                if (resultText) {
                  onSaveToLibrary(resultText);
                }
              }}
            >
              Save to library
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={!resultText || loading}
            onClick={() => void handleCopy()}
          >
            {copied ? (
              <>
                <Check className="size-4" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" aria-hidden />
                Copy result
              </>
            )}
          </Button>
          <Button
            type="button"
            disabled={!resultText || loading || Boolean(error)}
            onClick={() => {
              onReplace();
              handleOpenChange(false);
            }}
          >
            Replace selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
