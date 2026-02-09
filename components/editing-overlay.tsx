"use client";

import { motion } from "motion/react";
import { useEditor } from "@/lib/editor-store";
import { GlowEffect } from "@/components/motion-primitives/glow-effect";

export function EditingOverlay() {
  const { state } = useEditor();

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="relative">
        {/* Glow effect behind the image */}
        <GlowEffect
          colors={["#d946ef", "#a855f7", "#6366f1", "#ec4899"]}
          mode="rotate"
          blur="strongest"
          scale={1.05}
          duration={4}
          className="rounded-lg"
        />

        {/* Blurred original image */}
        <motion.div
          initial={{ filter: "blur(0px)" }}
          animate={{ filter: "blur(8px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="relative z-10 overflow-hidden rounded-lg"
        >
          {state.imageDataUrl && (
            <img
              src={state.imageDataUrl}
              alt="Image being edited"
              className="max-h-[70vh] max-w-full object-contain"
            />
          )}

          {/* Dim + shimmer overlay on the image */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.45) 100%)",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background:
                "linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(217, 70, 239, 0.1) 100%)",
            }}
          />
        </motion.div>

      </div>
    </div>
  );
}
