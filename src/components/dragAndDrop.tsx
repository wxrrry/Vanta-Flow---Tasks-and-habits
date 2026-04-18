// dragAndDrop.tsx
// Вспомогательные хуки и типы для drag-and-drop задач и подзадач
import { useRef } from 'react';

export function useDraggableList<T>(items: T[], onMove: (from: number, to: number) => void) {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };
  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
  };
  const handleDragEnd = () => {
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      onMove(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return { handleDragStart, handleDragEnter, handleDragEnd };
}
