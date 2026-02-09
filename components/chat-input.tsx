"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
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
          ? "bg-orange-500/15 text-orange-400"
          : "bg-fuchsia-500/15 text-fuchsia-400"
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

  const hasImage = state.imageDataUrl !== null;
  const isSelection = state.status === "selection";
  const isSelected = state.status === "selected";
  const isEditing = state.status === "editing";
  const showTag = (isSelection && hasImage) || isSelected;

  const canSubmit =
    input.trim().length > 0 &&
    state.status === "selected" &&
    state.maskDataUrl !== null;

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
    setInput("");

    try {
      const result = await submitInpaint(
        state.imageDataUrl!,
        state.maskDataUrl!,
        prompt
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
        editedImageUrl: result.editedImageUrl,
      });
    } catch (err) {
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
    }
  }, [canSubmit, input, dispatch, state.imageDataUrl, state.maskDataUrl]);

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
    <div className="flex w-full items-center gap-3 rounded-full border border-zinc-800 bg-zinc-950 px-2 pl-4 py-2">
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
            "w-full bg-transparent text-sm text-zinc-200 outline-none",
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

      {/* Send button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || isEditing}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
          canSubmit
            ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
            : "bg-zinc-800 text-zinc-600"
        )}
      >
        <ArrowUp className="size-5" />
      </button>
    </div>
  );
}
