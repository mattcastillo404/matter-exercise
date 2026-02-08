"use client";

import { useReducer, type ReactNode } from "react";
import {
  EditorContext,
  editorReducer,
  initialEditorState,
} from "@/lib/editor-store";

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}
