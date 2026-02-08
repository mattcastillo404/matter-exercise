import { EditorProvider } from "@/components/editor-provider";
import { EditorLayout } from "@/components/editor-layout";

export default function Home() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
