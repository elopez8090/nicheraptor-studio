"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ArticleRowActionsProps = {
  articleId: string;
};

export function ArticleRowActions({ articleId }: ArticleRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"duplicate" | "delete" | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function handleDuplicate() {
    setBusy("duplicate");
    try {
      const response = await fetch(`/api/articles/${articleId}/duplicate`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && typeof data.articleId === "string") {
        router.push(`/articles/${data.articleId}/editor`);
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy("delete");
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setConfirmDeleteOpen(false);
        if (window.location.pathname.includes("/editor")) {
          router.push("/articles");
        } else {
          router.refresh();
        }
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="default"
        disabled={busy !== null}
        onClick={() => void handleDuplicate()}
      >
        <Copy className="size-4" aria-hidden />
        {busy === "duplicate" ? "…" : "Duplicate"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="default"
        disabled={busy !== null}
        onClick={() => setConfirmDeleteOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
        {busy === "delete" ? "…" : "Delete"}
      </Button>
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete article?</DialogTitle>
            <DialogDescription>
              This action permanently removes the article draft and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy === "delete"}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy === "delete"}
              onClick={() => void handleDelete()}
            >
              {busy === "delete" ? "Deleting…" : "Delete article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
