"use client";

import { motion } from "motion/react";
import { RotateCcw, Download, Pencil } from "lucide-react";
import { useEditor } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { ImageDropzone } from "@/components/image-dropzone";
import { UploadProgress } from "@/components/upload-progress";
import { ImageCanvas } from "@/components/image-canvas";
import { EditingOverlay } from "@/components/editing-overlay";
import { ErrorOverlay } from "@/components/error-overlay";

export function EditorView() {
  const { state, dispatch } = useEditor();

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

    case "complete":
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex h-full w-full flex-col items-center justify-center gap-6 p-8"
        >
          {state.editedImageUrl && (
            <img
              src={state.editedImageUrl}
              alt="Edited result"
              className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => dispatch({ type: "EDIT_ANOTHER" })}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit again
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => dispatch({ type: "RESET" })}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </Button>
            {state.editedImageUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                asChild
              >
                <a href={state.editedImageUrl} download="edited-image.png">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </motion.div>
      );

    case "error":
      return <ErrorOverlay />;

    default:
      return null;
  }
}
