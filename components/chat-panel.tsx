"use client";

import { ChatInput } from "@/components/chat-input";

export function ChatPanel() {
  return (
    <div className="border-t border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <ChatInput />
      </div>
    </div>
  );
}
