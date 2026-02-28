import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { DriveFile } from "../api";

export function useFileDragDrop(file: DriveFile, canEdit: boolean) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `drag-${file.id}`,
    data: { id: file.id, type: "file", file },
    disabled: !canEdit,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${file.id}`,
    data: { id: file.id, type: "folder" },
    disabled: !file.isFolder,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    isOver,
  };
}
