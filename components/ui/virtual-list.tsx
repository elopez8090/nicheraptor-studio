"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type VirtualListProps<T> = {
  items: T[];
  rowHeight: number;
  className?: string;
  maxHeight?: number;
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => string;
};

export function VirtualList<T>({
  items,
  rowHeight,
  className,
  maxHeight = 480,
  overscan = 4,
  renderRow,
  getKey,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(maxHeight);

  const totalHeight = items.length * rowHeight;

  const { start, end } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    return { start: startIndex, end: endIndex };
  }, [items.length, overscan, rowHeight, scrollTop, viewportHeight]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewportHeight(el.clientHeight || maxHeight);
    });
    ro.observe(el);
    setViewportHeight(el.clientHeight || maxHeight);
    return () => ro.disconnect();
  }, [maxHeight]);

  const slice = items.slice(start, end);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-y-auto", className)}
      style={{ maxHeight }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {slice.map((item, i) => {
          const index = start + i;
          return (
            <div
              key={getKey(item, index)}
              style={{
                position: "absolute",
                top: index * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
              }}
            >
              {renderRow(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
