"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { layoutCaseMasonry, type MasonryPlacement } from "@/lib/cases/masonry";

type MasonryState = {
  key: string;
  height: number;
  positions: MasonryPlacement[];
};

export function CaseMasonry({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const cards = Children.toArray(children);
  const key = JSON.stringify(
    cards.map((card, index) => (isValidElement(card) ? card.key : index)),
  );
  const [layout, setLayout] = useState<MasonryState | null>(null);
  const current = layout?.key === key ? layout : null;

  useEffect(() => {
    const element = root.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const nodes = Array.from(
      element.querySelectorAll<HTMLElement>(":scope > [data-masonry-item]"),
    );
    let frame = 0;
    let previous = "";
    let disposed = false;
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const style = getComputedStyle(element);
        const columns = Number(style.getPropertyValue("--case-columns"));
        const gap = parseFloat(style.columnGap);
        const width = element.getBoundingClientRect().width;
        if (
          !Number.isInteger(columns) ||
          columns < 1 ||
          !Number.isFinite(gap) ||
          width <= 0
        )
          return;
        const columnWidth = (width - gap * (columns - 1)) / columns;
        if (columnWidth <= 0) return;
        const next = {
          key,
          ...layoutCaseMasonry(
            nodes.map((node) => node.getBoundingClientRect().height),
            columns,
            columnWidth,
            gap,
          ),
        };
        const signature = JSON.stringify(next);
        if (signature !== previous) {
          previous = signature;
          setLayout(next);
        }
      });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    nodes.forEach((node) => observer.observe(node));
    schedule();
    window.addEventListener("resize", schedule);
    // Font readiness and initial scheduling also cover delayed style/layout
    // initialization when entering directly at the wall's hash anchor.
    void document.fonts.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [key]);

  return (
    <div
      ref={root}
      className="case-wall"
      data-testid="case-wall"
      data-masonry={current ? "true" : undefined}
      style={current ? { height: current.height } : undefined}
    >
      {cards.map((card, index) => (
        <div
          key={isValidElement(card) ? card.key : index}
          data-masonry-item
          className="case-masonry-item"
          style={current?.positions[index]}
        >
          {card}
        </div>
      ))}
    </div>
  );
}
