import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export const FILE_INPUT_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "application/pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
].join(",");

export function useAttachmentSelection() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
  }, []);

  const clearSelectedFile = useCallback(() => {
    revokePreviewUrl();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [revokePreviewUrl]);

  const selectFile = useCallback(
    (file) => {
      if (!file) return false;
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        toast.error("This file type is not supported.");
        return false;
      }
      if (file.size <= 0) {
        toast.error("The selected file is empty.");
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File cannot exceed 10 MB.");
        return false;
      }

      revokePreviewUrl();
      setSelectedFile(file);

      if (file.type.startsWith("image/")) {
        const nextPreviewUrl = URL.createObjectURL(file);
        previewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
      }

      return true;
    },
    [revokePreviewUrl],
  );

  useEffect(() => revokePreviewUrl, [revokePreviewUrl]);

  return {
    clearSelectedFile,
    fileInputRef,
    previewUrl,
    selectedFile,
    selectFile,
  };
}

