"use client";

import { useEditor } from "@/lib/editor-store";
import { ImageDropzone } from "@/components/image-dropzone";
import { UploadProgress } from "@/components/upload-progress";
import { ImageCanvas } from "@/components/image-canvas";
import { EditingOverlay } from "@/components/editing-overlay";
import { ErrorOverlay } from "@/components/error-overlay";

export function EditorView() {
  const { state } = useEditor();

  switch (state.status) {
    case "empty":
      return <ImageDropzone />;

    case "uploading":
      return <UploadProgress progress={state.uploadProgress} />;

    case "selection":
    case "selected":
      return <ImageCanvas />;

    case "editing":
      return <EditingOverlay />;

    case "error":
      return <ErrorOverlay />;

    default:
      return null;
  }
}
