"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type RegenerateChapterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterTitle: string;
  onConfirm: () => void;
  busy?: boolean;
};

export function RegenerateChapterDialog({
  open,
  onOpenChange,
  chapterTitle,
  onConfirm,
  busy = false,
}: RegenerateChapterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate chapter?</DialogTitle>
          <DialogDescription>
            This will replace the current draft of{" "}
            <span className="font-medium text-foreground">{chapterTitle}</span>{" "}
            with new AI-written content. Your previous text cannot be restored
            automatically.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Regenerate chapter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
