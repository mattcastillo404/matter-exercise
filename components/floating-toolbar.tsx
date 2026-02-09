"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

export function FloatingToolbar({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute right-3 top-3 z-20"
    >
      <div className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/90 p-1 shadow-lg backdrop-blur-sm">
        {children}
      </div>
    </motion.div>
  );
}

function triggerDownload(dataUrl: string, filename: string) {
  // Convert data URL to blob so the browser treats it as a file download
  // rather than navigating to the URL.
  fetch(dataUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
}

export function ToolbarButton({
  icon,
  label,
  onClick,
  href,
  download,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  download?: string;
  disabled?: boolean;
}) {
  const className =
    "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
    (disabled
      ? "text-zinc-600 cursor-not-allowed"
      : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100");

  const handleClick = disabled
    ? undefined
    : href
      ? () => triggerDownload(href, download ?? "download")
      : onClick;

  return (
    <button type="button" onClick={handleClick} disabled={disabled} className={className}>
      {icon}
      {label}
    </button>
  );
}
