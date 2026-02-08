"use client";

import { useState, useRef, useCallback } from "react";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useEditor } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { submitInpaint } from "@/lib/api";

function RemovableTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-center gap-1 rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 transition-colors hover:bg-orange-500/30"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}

export function ChatInput() {
  const { state, dispatch } = useEditor();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showImageTag =
    state.status === "selection" && state.imageDataUrl !== null;
  const showSelectionTag = state.status === "selected";
  const isEditing = state.status === "editing";

  const placeholder =
    state.status === "empty" || state.status === "uploading"
      ? "Generate an image"
      : "Describe your edits";

  const canSubmit =
    input.trim().length > 0 &&
    state.status === "selected" &&
    state.maskDataUrl !== null;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    const prompt = input.trim();

    // Add user message to chat
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

    // Add assistant "thinking" message
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Making edits...",
        timestamp: Date.now(),
      },
    });

    dispatch({ type: "SUBMIT_EDIT", prompt });
    setInput("");

    // Call the inpaint API
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

      dispatch({ type: "EDIT_COMPLETE", editedImageUrl: result.editedImageUrl });
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRemoveTag = (tag: "image" | "selection") => {
    dispatch({ type: "REMOVE_TAG", tag });
  };

  return (
    <div className="border-t border-zinc-800 p-3">
      {/* Tags area */}
      <div className="mb-2 flex min-h-[24px] items-center gap-2">
        <AnimatePresence mode="popLayout">
          {showImageTag && (
            <RemovableTag
              key="image"
              label="Image"
              onRemove={() => handleRemoveTag("image")}
            />
          )}
          {showSelectionTag && (
            <RemovableTag
              key="selection"
              label="Selection"
              onRemove={() => handleRemoveTag("selection")}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="relative flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isEditing}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors",
            "placeholder:text-zinc-500",
            "focus:ring-1 focus:ring-fuchsia-500/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "max-h-32 min-h-[40px]"
          )}
          style={{ height: "auto", overflow: "hidden" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSubmit}
          disabled={!canSubmit || isEditing}
          className={cn(
            "h-10 w-10 flex-shrink-0 rounded-lg transition-colors",
            canSubmit
              ? "bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              : "text-zinc-600"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
