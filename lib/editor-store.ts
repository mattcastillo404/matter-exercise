"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

// ---------- State types ----------

export type EditorStatus =
  | "empty"
  | "uploading"
  | "selection"
  | "selected"
  | "editing"
  | "complete"
  | "error";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageThumb?: string; // small base64 thumbnail
  timestamp: number;
};

export type EditorState = {
  status: EditorStatus;
  imageDataUrl: string | null;
  maskDataUrl: string | null;
  lassoPath: number[][] | null;
  prompt: string;
  editedImageUrl: string | null;
  error: string | null;
  uploadProgress: number;
  chatMessages: ChatMessage[];
};

// ---------- Actions ----------

export type EditorAction =
  | { type: "START_UPLOAD"; file: File }
  | { type: "SET_UPLOAD_PROGRESS"; progress: number }
  | { type: "UPLOAD_COMPLETE"; imageDataUrl: string }
  | { type: "SET_LASSO"; maskDataUrl: string; lassoPath: number[][] }
  | { type: "CLEAR_LASSO" }
  | { type: "SET_PROMPT"; prompt: string }
  | { type: "SUBMIT_EDIT"; prompt: string }
  | { type: "EDIT_COMPLETE"; editedImageUrl: string }
  | { type: "EDIT_ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "EDIT_ANOTHER" }
  | { type: "RESET" }
  | { type: "ADD_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "REMOVE_TAG"; tag: "image" | "selection" };

// ---------- Initial state ----------

export const initialEditorState: EditorState = {
  status: "empty",
  imageDataUrl: null,
  maskDataUrl: null,
  lassoPath: null,
  prompt: "",
  editedImageUrl: null,
  error: null,
  uploadProgress: 0,
  chatMessages: [],
};

// ---------- Reducer ----------

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "START_UPLOAD":
      return {
        ...state,
        status: "uploading",
        uploadProgress: 0,
        error: null,
      };

    case "SET_UPLOAD_PROGRESS":
      return {
        ...state,
        uploadProgress: action.progress,
      };

    case "UPLOAD_COMPLETE":
      return {
        ...state,
        status: "selection",
        imageDataUrl: action.imageDataUrl,
        uploadProgress: 100,
      };

    case "SET_LASSO":
      return {
        ...state,
        status: "selected",
        maskDataUrl: action.maskDataUrl,
        lassoPath: action.lassoPath,
      };

    case "CLEAR_LASSO":
      return {
        ...state,
        status: "selection",
        maskDataUrl: null,
        lassoPath: null,
      };

    case "SET_PROMPT":
      return {
        ...state,
        prompt: action.prompt,
      };

    case "SUBMIT_EDIT":
      return {
        ...state,
        status: "editing",
        prompt: action.prompt,
      };

    case "EDIT_COMPLETE":
      return {
        ...state,
        status: "complete",
        editedImageUrl: action.editedImageUrl,
      };

    case "EDIT_ERROR":
      return {
        ...state,
        status: "error",
        error: action.error,
      };

    case "RETRY":
      return {
        ...state,
        status: "selected",
        error: null,
      };

    case "EDIT_ANOTHER":
      return {
        ...state,
        status: "selection",
        maskDataUrl: null,
        lassoPath: null,
        prompt: "",
        editedImageUrl: null,
        error: null,
        // keep the edited image as the new source
        imageDataUrl: state.editedImageUrl ?? state.imageDataUrl,
      };

    case "RESET":
      return initialEditorState;

    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.message],
      };

    case "REMOVE_TAG":
      if (action.tag === "selection") {
        return {
          ...state,
          status: "selection",
          maskDataUrl: null,
          lassoPath: null,
        };
      }
      // removing image tag resets everything
      return initialEditorState;

    default:
      return state;
  }
}

// ---------- Context ----------

type EditorContextValue = {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
};

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return ctx;
}
