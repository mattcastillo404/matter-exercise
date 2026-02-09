"use client";

import { EditorView } from "@/components/editor-view";
import { ChatPanel } from "@/components/chat-panel";

export function EditorLayout() {
  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-white">
      {/* Main editor area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <EditorView />
      </div>

      {/* Bottom chat input bar */}
      <ChatPanel />
    </div>
  );
}
