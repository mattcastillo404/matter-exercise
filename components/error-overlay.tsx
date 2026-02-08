"use client";

import { motion } from "motion/react";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { useEditor } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";

export function ErrorOverlay() {
  const { state, dispatch } = useEditor();

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="relative">
        {/* Dimmed original image behind */}
        {state.imageDataUrl && (
          <img
            src={state.imageDataUrl}
            alt="Original"
            className="max-h-[70vh] max-w-full rounded-lg object-contain opacity-30"
          />
        )}

        {/* Error card centered on top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl border border-red-900/50 bg-zinc-900/95 p-6 text-center shadow-2xl backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-200">
                Something went wrong
              </h3>
              <p className="mt-1.5 text-sm text-zinc-400">
                {state.error || "An unexpected error occurred while editing your image."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                onClick={() => dispatch({ type: "RETRY" })}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                onClick={() => dispatch({ type: "RESET" })}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Start over
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
