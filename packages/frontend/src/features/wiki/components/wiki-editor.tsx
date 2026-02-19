import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { Block } from "@blocknote/core";

function useIsDark() {
  return useSyncExternalStore(
    (cb) => {
      const observer = new MutationObserver(cb);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
  );
}

interface WikiEditorProps {
  initialContent?: unknown;
  readOnly?: boolean;
  onChange?: (content: Block[]) => void;
}

export function WikiEditor({ initialContent, readOnly = false, onChange }: WikiEditorProps) {
  const isDark = useIsDark();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useCreateBlockNote({
    initialContent: (initialContent as Block[] | undefined) ?? undefined,
  });

  const handleChange = useCallback(() => {
    if (onChangeRef.current) {
      onChangeRef.current(editor.document);
    }
  }, [editor]);

  // Sync readOnly state
  useEffect(() => {
    editor.isEditable = !readOnly;
  }, [editor, readOnly]);

  return (
    <div className={`wiki-editor-wrapper${readOnly ? "" : " is-editing"}`}>
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        onChange={handleChange}
        theme={isDark ? "dark" : "light"}
      />
    </div>
  );
}
