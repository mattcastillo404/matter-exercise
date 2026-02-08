"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, ImageIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useEditor } from "@/lib/editor-store";

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only PNG and JPEG images are supported.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Image must be less than 10MB.";
  }
  return null;
}

export function ImageDropzone() {
  const { dispatch } = useEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      dispatch({ type: "START_UPLOAD", file });

      // Read file as data URL with simulated progress
      const reader = new FileReader();
      const startTime = Date.now();

      // Simulate incremental progress
      let progressInterval: ReturnType<typeof setInterval>;
      let currentProgress = 0;

      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.random() * 15, 90);
        dispatch({
          type: "SET_UPLOAD_PROGRESS",
          progress: Math.round(currentProgress),
        });
      }, 200);

      reader.onload = () => {
        clearInterval(progressInterval);
        dispatch({ type: "SET_UPLOAD_PROGRESS", progress: 100 });

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 3000 - elapsed);

        // Enforce minimum 3 second display
        setTimeout(() => {
          dispatch({
            type: "UPLOAD_COMPLETE",
            imageDataUrl: reader.result as string,
          });
        }, remaining);
      };

      reader.onerror = () => {
        clearInterval(progressInterval);
        setError("Failed to read the image file.");
      };

      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Full-page drag listeners
  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      {/* Full-page drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-fuchsia-500 bg-fuchsia-500/10 p-16">
              <Upload className="h-12 w-12 text-fuchsia-400" />
              <p className="text-lg font-medium text-fuchsia-300">
                Drop your image here
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropzone area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex h-full w-full items-center justify-center p-8"
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group flex w-full max-w-xl cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-16 transition-all duration-200",
            "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 transition-colors group-hover:bg-zinc-700">
            <ImageIcon className="h-8 w-8 text-zinc-400 transition-colors group-hover:text-zinc-300" />
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-zinc-300">
              Upload an image
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              PNG or JPEG, up to 10MB
            </p>
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={onInputChange}
        />
      </motion.div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-red-900/90 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
