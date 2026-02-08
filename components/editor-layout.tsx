"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EditorView } from "@/components/editor-view";
import { ChatPanel } from "@/components/chat-panel";

export function EditorLayout() {
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Main editor area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <EditorView />

        {/* Toggle chat panel button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-20 text-zinc-400 hover:text-zinc-100"
          onClick={() => setChatOpen((v) => !v)}
        >
          {chatOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRightOpen className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Chat sidebar */}
      <div
        className={cn(
          "flex-shrink-0 border-l border-zinc-800 bg-zinc-900 transition-all duration-300 ease-in-out",
          chatOpen ? "w-[380px]" : "w-0 overflow-hidden border-l-0"
        )}
      >
        {chatOpen && <ChatPanel />}
      </div>
    </div>
  );
}
