"use client";
import { useEffect, useRef } from "react";
import { panelDragState } from "./useBoardInput";

export function useDraggablePanel(isMobileCheck?: () => boolean) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !panelRef.current) return;
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      panelRef.current.style.transform = `translate(${x}px, ${y}px)`;
      panelDragState.isDragging = true;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      panelDragState.isDragging = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobileCheck && isMobileCheck()) return;

    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (target.closest("input, button, label, a, textarea")) {
      return;
    }

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDragging.current = true;

    const transform = window.getComputedStyle(panelRef.current!).transform;
    let currentX = 0,
      currentY = 0;
    if (transform && transform !== "none") {
      const matrix = new DOMMatrix(transform);
      currentX = matrix.m41;
      currentY = matrix.m42;
    }

    dragOffset.current = {
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    };
  };

  return { panelRef, handleMouseDown };
}
