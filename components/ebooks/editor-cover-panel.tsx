"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  COVER_MIN_HEIGHT,
  COVER_MIN_WIDTH,
  COVER_RECOMMENDED_HEIGHT,
  COVER_RECOMMENDED_WIDTH,
  COVER_UPLOAD_ACCEPT,
  COVER_UPLOAD_MAX_BYTES,
  formatCoverFileSize,
  getCoverUploadWarnings,
  isAcceptedCoverMime,
  loadCoverImageDimensions,
} from "@/lib/ebooks/cover-upload-validation";

type EditorCoverPanelProps = {
  projectId: string;
  defaultCoverTitle: string;
  defaultAudience: string;
  initialCoverImageUrl: string | null;
};

type PanelStatus = "idle" | "loading" | "success" | "error";

function withCacheBust(url: string, version: number): string {
  if (version === 0) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

export function EditorCoverPanel({
  projectId,
  defaultCoverTitle,
  defaultAudience,
  initialCoverImageUrl,
}: EditorCoverPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverTitle, setCoverTitle] = useState(defaultCoverTitle);
  const [subtitle, setSubtitle] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [audience, setAudience] = useState(defaultAudience);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initialCoverImageUrl,
  );
  const [coverVersion, setCoverVersion] = useState(0);
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingDimensions, setPendingDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [pendingWarnings, setPendingWarnings] = useState<string[]>([]);
  const [uploadConfirmStep, setUploadConfirmStep] = useState(false);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [pendingPreviewUrl]);

  const resetPendingUpload = useCallback(() => {
    setPendingFile(null);
    setPendingDimensions(null);
    setPendingWarnings([]);
    setUploadConfirmStep(false);
    setPendingPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const closeUploadDialog = useCallback(() => {
    setUploadDialogOpen(false);
    resetPendingUpload();
  }, [resetPendingUpload]);

  const runGenerate = useCallback(async () => {
    setMessage(null);
    setStatus("loading");

    try {
      const response = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          coverTitle,
          subtitle,
          stylePrompt,
          audience,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        details?: string;
        coverImageUrl?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(
          payload.error ??
            payload.details ??
            "Could not generate cover. Please try again.",
        );
        return;
      }

      const url =
        typeof payload.coverImageUrl === "string" ? payload.coverImageUrl : "";
      if (!url) {
        setStatus("error");
        setMessage("Cover was created but no image URL was returned.");
        return;
      }

      setCoverImageUrl(url);
      setCoverVersion((v) => v + 1);
      setStatus("success");
      setMessage("AI cover saved to your project.");
    } catch {
      setStatus("error");
      setMessage("Network error. Check your connection and try again.");
    }
  }, [projectId, coverTitle, subtitle, stylePrompt, audience]);

  const runRemove = useCallback(async () => {
    setMessage(null);
    setStatus("loading");

    try {
      const response = await fetch(`/api/ebook-projects/${projectId}/cover`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { error?: string; details?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(
          payload.error ?? payload.details ?? "Could not remove cover.",
        );
        return;
      }

      setCoverImageUrl(null);
      setCoverVersion(0);
      setStatus("success");
      setMessage("Cover removed.");
    } catch {
      setStatus("error");
      setMessage("Network error. Check your connection and try again.");
    }
  }, [projectId]);

  const runUpload = useCallback(
    async (file: File, ignoreWarnings: boolean) => {
      setMessage(null);
      setStatus("loading");

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (ignoreWarnings) {
          formData.append("ignoreWarnings", "true");
        }

        const response = await fetch(`/api/ebook-projects/${projectId}/cover`, {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as {
          error?: string;
          details?: string;
          warnings?: string[];
          coverImageUrl?: string;
        };

        if (response.status === 422 && payload.warnings?.length) {
          setPendingWarnings(payload.warnings);
          setUploadConfirmStep(true);
          setStatus("idle");
          return;
        }

        if (!response.ok) {
          setStatus("error");
          setMessage(
            payload.error ??
              payload.details ??
              "Could not upload cover. Please try again.",
          );
          return;
        }

        const url =
          typeof payload.coverImageUrl === "string" ? payload.coverImageUrl : "";
        if (!url) {
          setStatus("error");
          setMessage("Cover was uploaded but no image URL was returned.");
          return;
        }

        setCoverImageUrl(url);
        setCoverVersion((v) => v + 1);
        setStatus("success");
        setMessage(
          payload.warnings?.length
            ? "Cover uploaded with noted warnings."
            : "Cover uploaded to your project.",
        );
        closeUploadDialog();
      } catch {
        setStatus("error");
        setMessage("Network error. Check your connection and try again.");
      }
    },
    [projectId, closeUploadDialog],
  );

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setMessage(null);
      setStatus("idle");

      if (!isAcceptedCoverMime(file.type)) {
        setStatus("error");
        setMessage("Invalid file type. Use JPG, PNG, or WebP.");
        resetPendingUpload();
        return;
      }

      if (file.size > COVER_UPLOAD_MAX_BYTES) {
        setStatus("error");
        setMessage(
          `File is too large (${formatCoverFileSize(file.size)}). Maximum is 10 MB.`,
        );
        resetPendingUpload();
        return;
      }

      try {
        const dimensions = await loadCoverImageDimensions(file);
        const warnings = getCoverUploadWarnings(dimensions.width, dimensions.height);
        const previewUrl = URL.createObjectURL(file);

        setPendingPreviewUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return previewUrl;
        });
        setPendingFile(file);
        setPendingDimensions(dimensions);
        setPendingWarnings(warnings);
        setUploadConfirmStep(false);
        setUploadDialogOpen(true);
      } catch {
        setStatus("error");
        setMessage("Could not read this image. Try another file.");
        resetPendingUpload();
      }
    },
    [resetPendingUpload],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const loading = status === "loading";
  const displayCoverUrl = coverImageUrl
    ? withCacheBust(coverImageUrl, coverVersion)
    : null;

  return (
    <>
      <Card className="shadow-premium">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="size-5 text-primary" aria-hidden />
            Cover
          </CardTitle>
          <CardDescription className="text-sm">
            Upload your own cover art or generate one with AI. JPG, PNG, or WebP
            up to 10 MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Recommended dimensions</p>
            <p className="mt-1">
              Portrait standard:{" "}
              <span className="font-medium text-foreground">
                {COVER_RECOMMENDED_WIDTH} × {COVER_RECOMMENDED_HEIGHT} px
              </span>{" "}
              (aspect 1 : 1.6)
            </p>
            <p>
              Minimum: {COVER_MIN_WIDTH} × {COVER_MIN_HEIGHT} px · Landscape
              Kindle-style (if needed): 2560 × 1600 px
            </p>
          </div>

          {displayCoverUrl ? (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayCoverUrl}
                alt={`Cover for ${coverTitle || defaultCoverTitle}`}
                className="mx-auto block h-auto w-full max-w-[200px] object-cover"
              />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No cover yet. Upload an image or generate one with AI below.
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={COVER_UPLOAD_ACCEPT}
            className="sr-only"
            onChange={(e) => void handleFileSelected(e)}
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={loading}
              onClick={openFilePicker}
            >
              <Upload className="size-4" aria-hidden />
              {coverImageUrl ? "Replace cover" : "Upload cover"}
            </Button>
            {coverImageUrl ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={loading}
                onClick={() => void runRemove()}
              >
                <Trash2 className="size-4" aria-hidden />
                Remove cover
              </Button>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-sm font-medium text-foreground">Generate with AI</p>
            <div className="space-y-2">
              <label
                htmlFor="cover-title"
                className="text-sm font-medium text-foreground"
              >
                Cover title
              </label>
              <Input
                id="cover-title"
                value={coverTitle}
                onChange={(e) => setCoverTitle(e.target.value)}
                disabled={loading}
                placeholder="Book title on cover"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cover-subtitle"
                className="text-sm font-medium text-foreground"
              >
                Subtitle
              </label>
              <Input
                id="cover-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                disabled={loading}
                placeholder="Optional subtitle"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cover-style"
                className="text-sm font-medium text-foreground"
              >
                Style prompt
              </label>
              <Textarea
                id="cover-style"
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                disabled={loading}
                placeholder="e.g. minimalist, bold typography, warm gradients"
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cover-audience"
                className="text-sm font-medium text-foreground"
              >
                Audience / niche
              </label>
              <Input
                id="cover-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                disabled={loading}
                placeholder="Who this ebook is for"
              />
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={loading || !coverTitle.trim() || !audience.trim()}
              onClick={() => void runGenerate()}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : coverImageUrl ? (
                <RefreshCw className="size-4" aria-hidden />
              ) : (
                <ImageIcon className="size-4" aria-hidden />
              )}
              Generate AI cover
            </Button>
          </div>

          {message ? (
            <p
              className={
                status === "error"
                  ? "text-sm text-destructive"
                  : status === "success"
                    ? "text-sm text-emerald-700 dark:text-emerald-400"
                    : "text-sm text-muted-foreground"
              }
              role={status === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeUploadDialog();
          } else {
            setUploadDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {uploadConfirmStep ? "Upload anyway?" : "Preview cover upload"}
            </DialogTitle>
            <DialogDescription>
              {pendingDimensions
                ? `${pendingDimensions.width} × ${pendingDimensions.height} px`
                : "Review your image before saving."}
            </DialogDescription>
          </DialogHeader>

          {pendingPreviewUrl ? (
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreviewUrl}
                alt="Cover upload preview"
                className="mx-auto block max-h-72 w-auto max-w-full object-contain"
              />
            </div>
          ) : null}

          {pendingWarnings.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800 dark:text-amber-200">
              {pendingWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={closeUploadDialog}
            >
              Cancel
            </Button>
            {uploadConfirmStep && pendingFile ? (
              <Button
                type="button"
                disabled={loading}
                onClick={() => void runUpload(pendingFile, true)}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Upload anyway
              </Button>
            ) : pendingFile ? (
              <Button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (pendingWarnings.length > 0) {
                    setUploadConfirmStep(true);
                    return;
                  }
                  void runUpload(pendingFile, false);
                }}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {pendingWarnings.length > 0 && !uploadConfirmStep
                  ? "Continue"
                  : "Upload cover"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
