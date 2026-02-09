"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";
import { ChatInput } from "@/components/chat-input";
import { useEditor } from "@/lib/editor-store";
import { TextShimmerWave } from "@/components/motion-primitives/text-shimmer-wave";

export function ChatPanel() {
  const { state } = useEditor();

  const isSelection =
    state.status === "selection" &&
    state.imageDataUrl !== null &&
    state.imageVersions.length <= 1;
  const isUploading = state.status === "uploading";
  const isEditing = state.status === "editing";

  const showStatusMessage = isSelection || isUploading || isEditing;

  return (
    <div className="py-4">
      <div className="mx-auto max-w-2xl">
        {/* Status messages between canvas and chat input */}
        <AnimatePresence mode="wait">
          {showStatusMessage && (
            <motion.div
              key={
                isUploading
                  ? "uploading"
                  : isEditing
                    ? "editing"
                    : "selection"
              }
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="mb-2 flex items-center justify-center gap-2"
            >
              {isSelection && (
                <p className="text-sm text-black/40">
                  Draw to select an area to edit
                </p>
              )}
              {isUploading && (
                <div className="flex items-center gap-2">
                  <TextShimmerWave
                    className="text-sm [--base-color:#a1a1aa] [--base-gradient-color:#d946ef]"
                    duration={1.2}
                    spread={1}
                  >
                    Uploading image...
                  </TextShimmerWave>
                </div>
              )}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-fuchsia-500" />
                  <TextShimmerWave
                    className="text-sm [--base-color:#a1a1aa] [--base-gradient-color:#d946ef]"
                    duration={1.2}
                    spread={1}
                  >
                    Making edits...
                  </TextShimmerWave>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <ChatInput />
      </div>
    </div>
  );
}
