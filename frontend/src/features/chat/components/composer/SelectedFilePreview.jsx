import { FileText, Image as ImageIcon, Music, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SelectedFilePreview({
  file,
  previewUrl,
  isUploading,
  uploadProgress,
  onRemove,
}) {
  return (
    <div className="mb-1 rounded-xl border bg-background/80 p-2">
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="size-14 shrink-0 rounded-lg border object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AttachmentIcon mimeType={file.type} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
            {isUploading ? ` · Uploading ${uploadProgress}%` : ""}
          </p>
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={isUploading}
          onClick={onRemove}
          aria-label="Remove attachment"
          className="shrink-0 rounded-lg"
        >
          <X className="size-4" />
        </Button>
      </div>

      {isUploading && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Attachment upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploadProgress}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function AttachmentIcon({ mimeType }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5" />;
  if (mimeType.startsWith("video/")) return <Video className="size-5" />;
  if (mimeType.startsWith("audio/")) return <Music className="size-5" />;
  return <FileText className="size-5" />;
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

