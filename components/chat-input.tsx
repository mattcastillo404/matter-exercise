"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, resizeImageToMatch } from "@/lib/utils";
import { useEditor } from "@/lib/editor-store";
import { submitInpaint } from "@/lib/api";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";

function Tag({
  label,
  variant = "fuchsia",
  onRemove,
}: {
  label: string;
  variant?: "fuchsia" | "orange";
  onRemove: () => void;
}) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium",
        variant === "orange"
          ? "bg-orange-500/10 text-orange-600"
          : "bg-fuchsia-500/10 text-fuchsia-600"
      )}
    >
      <span className="max-w-[100px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "rounded-full p-0.5 transition-colors",
          variant === "orange" ? "hover:bg-orange-500/20" : "hover:bg-fuchsia-500/20"
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}

export function ChatInput() {
  const { state, dispatch } = useEditor();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasImage = state.imageDataUrl !== null;
  const isSelection = state.status === "selection";
  const isSelected = state.status === "selected";
  const isEditing = state.status === "editing";
  const showTag = (isSelection && hasImage) || isSelected;

  const canSubmit =
    input.trim().length > 0 &&
    state.status === "selected" &&
    state.maskDataUrl !== null;

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch({ type: "CANCEL_EDIT" });
  }, [dispatch]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    const prompt = input.trim();

    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        imageThumb: state.imageDataUrl ?? undefined,
        timestamp: Date.now(),
      },
    });

    dispatch({ type: "SUBMIT_EDIT", prompt });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await submitInpaint(
        state.imageDataUrl!,
        state.maskDataUrl!,
        prompt,
        controller.signal
      );

      // Resize the returned image to match the original dimensions —
      // the AI model may return a different resolution (e.g. 1024x1024).
      const originalUrl = state.imageVersions[0];
      const resizedUrl = await resizeImageToMatch(
        result.editedImageUrl,
        originalUrl
      );

      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Here are your edits!",
          timestamp: Date.now(),
        },
      });

      dispatch({
        type: "EDIT_COMPLETE",
        editedImageUrl: resizedUrl,
      });

      setInput("");
    } catch (err) {
      // Silently handle aborted requests — the user cancelled intentionally
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";

      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${errorMessage}`,
          timestamp: Date.now(),
        },
      });

      dispatch({ type: "EDIT_ERROR", error: errorMessage });
    } finally {
      abortControllerRef.current = null;
    }
  }, [canSubmit, input, dispatch, state.imageDataUrl, state.maskDataUrl, state.imageVersions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRemoveTag = (tag: "image" | "selection") => {
    dispatch({ type: "REMOVE_TAG", tag });
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-full border border-black/10 bg-white px-2 pl-4 py-2">
      {/* Removable tag — transitions from orange "Image" to default "Selection" */}
      <AnimatePresence mode="popLayout">
        {showTag && (
          <Tag
            key="context-tag"
            label={isSelected ? "Selection" : "Image"}
            variant={isSelected ? "fuchsia" : "orange"}
            onRemove={() =>
              handleRemoveTag(isSelected ? "selection" : "image")
            }
          />
        )}
      </AnimatePresence>

      {/* Text input with shimmer placeholder */}
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isEditing}
          className={cn(
            "w-full bg-transparent text-sm text-black outline-none placeholder:text-black/30",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        {input.length === 0 && !isEditing && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center"
            onClick={() => inputRef.current?.focus()}
          >
            <TextShimmer className="text-sm" duration={3}>
              {hasImage ? "Describe your edits..." : "Generate an image..."}
            </TextShimmer>
          </div>
        )}
      </div>

      {/* Send / Stop button */}
      {isEditing ? (
        <button
          type="button"
          onClick={handleCancel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/80"
        >
          <Square className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            canSubmit
              ? "bg-black text-white hover:bg-black/80"
              : "bg-black/5 text-black/25"
          )}
        >
          <ArrowUp className="size-5" />
        </button>
      )}
    </div>
  );
}
