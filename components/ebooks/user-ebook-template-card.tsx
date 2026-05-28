"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createEbookFromTemplate } from "@/lib/ebooks/create-ebook-from-template";
import type { UserEbookTemplate } from "@/lib/ebooks/fetch-user-templates";

type UserEbookTemplateCardProps = {
  template: UserEbookTemplate;
  onUpdated: () => void;
};

export function UserEbookTemplateCard({
  template,
  onUpdated,
}: UserEbookTemplateCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [defaultTitle, setDefaultTitle] = useState(template.defaultTitle);

  async function handleUse() {
    setLoading(true);
    setError(null);
    try {
      const result = await createEbookFromTemplate(template.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/ebooks/${result.projectId}/chapters`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          defaultTitle,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not update template.");
        return;
      }
      setEditOpen(false);
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user-templates/${template.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not delete template.");
        return;
      }
      setDeleteOpen(false);
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="flex h-full flex-col shadow-premium">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutTemplate className="size-5" aria-hidden />
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Personal
            </span>
          </div>
          <CardTitle className="text-xl leading-snug">{template.name}</CardTitle>
          <CardDescription>
            {template.description || "Saved from your outline library."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">
            {template.chapters.length} chapters · default title:{" "}
            <span className="text-foreground">{template.defaultTitle}</span>
          </p>
          {error && !editOpen && !deleteOpen ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30">
          <Button
            type="button"
            className="flex-1"
            disabled={loading}
            onClick={() => void handleUse()}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              "Use template"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Edit template"
            onClick={() => {
              setName(template.name);
              setDescription(template.description);
              setDefaultTitle(template.defaultTitle);
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            aria-label="Delete template"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
            <DialogDescription>
              Update the display name and default project title. Chapter structure is
              preserved from when you saved the template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Template name" />
            <Input
              value={defaultTitle}
              onChange={(e) => setDefaultTitle(e.target.value)}
              aria-label="Default title"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Description"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={loading} onClick={() => void handleSaveEdit()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-foreground">{template.name}</span>{" "}
              from your personal templates. Existing projects are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
