"use client";

import { useRef, useEffect } from "react";
import { Sparkles, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useEditor, type ChatMessage } from "@/lib/editor-store";
import { ChatInput } from "@/components/chat-input";
import { TextShimmerWave } from "@/components/motion-primitives/text-shimmer-wave";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isShimmer = !isUser && message.content === "Making edits...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-zinc-700" : "bg-fuchsia-600/20"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-zinc-300" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex max-w-[260px] flex-col gap-2 rounded-xl px-3 py-2",
          isUser ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800/50 text-zinc-300"
        )}
      >
        {/* Image thumbnail if present */}
        {message.imageThumb && (
          <img
            src={message.imageThumb}
            alt="Uploaded image"
            className="h-20 w-full rounded-lg object-cover"
          />
        )}

        {isShimmer ? (
          <TextShimmerWave
            className="text-sm [--base-color:#a1a1aa] [--base-gradient-color:#d946ef]"
            duration={1.2}
            spread={1}
          >
            {message.content}
          </TextShimmerWave>
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
      </div>
    </motion.div>
  );
}

export function ChatPanel() {
  const { state } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.chatMessages]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <Sparkles className="h-4 w-4 text-fuchsia-400" />
        <h2 className="text-sm font-semibold text-zinc-200">AI Editor</h2>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
      >
        {state.chatMessages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
              <Sparkles className="h-6 w-6 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">
                AI Image Editor
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Upload an image, select an area, and describe your edits.
              </p>
            </div>
          </div>
        ) : (
          state.chatMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
      </div>

      {/* Input area */}
      <ChatInput />
    </div>
  );
}
