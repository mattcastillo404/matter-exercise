"use client";

import { motion } from "motion/react";

const CIRCLE_RADIUS = 54;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function UploadProgress({ progress }: { progress: number }) {
  const offset = CIRCLE_CIRCUMFERENCE - (progress / 100) * CIRCLE_CIRCUMFERENCE;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full w-full flex-col items-center justify-center gap-6"
    >
      {/* Circular progress ring */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-black/10"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-black"
            strokeDasharray={CIRCLE_CIRCUMFERENCE}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </svg>
        {/* Percentage text */}
        <span className="absolute text-lg font-semibold text-black">
          {Math.round(progress)}%
        </span>
      </div>
    </motion.div>
  );
}
