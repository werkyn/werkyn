import { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import { SafeHtml } from "@/components/safe-html";
import { useUpdateTask } from "../api";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface TaskDescriptionProps {
  taskId: string;
  description: string | null;
  canEdit: boolean;
}

export function TaskDescription({
  taskId,
  description,
  canEdit,
}: TaskDescriptionProps) {
  const updateTask = useUpdateTask();

  const debouncedSave = useDebouncedCallback(
    useCallback(
      (...args: unknown[]) => {
        const html = args[0] as string;
        updateTask.mutate({ id: taskId, description: html || null });
      },
      [taskId, updateTask],
    ),
    800,
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Add a description..." }),
    ],
    content: description ? DOMPurify.sanitize(description) : "",
    editable: canEdit,
    onUpdate: ({ editor: e }) => {
      debouncedSave(e.getHTML());
    },
  });

  // Update editable state if canEdit changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  if (!canEdit && !description) {
    return (
      <p className="text-sm text-muted-foreground italic">No description</p>
    );
  }

  if (!canEdit && description) {
    return (
      <SafeHtml
        className="prose prose-sm dark:prose-invert max-w-none"
        html={description}
      />
    );
  }

  return (
    <div className="rounded-md border p-3 min-h-[100px] [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none">
      <EditorContent editor={editor} className="text-sm" />
    </div>
  );
}
