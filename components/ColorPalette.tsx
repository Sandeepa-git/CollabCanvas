"use client";

import type { Sentiment } from "@/lib/types";

type ColorPaletteProps = {
  colors: string[];
  sentiment: Sentiment;
};

export function ColorPalette({ colors, sentiment }: ColorPaletteProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sentiment Palette</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-700">
          {sentiment}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-6 overflow-hidden rounded-md">
        {colors.map((color) => (
          <div
            key={color}
            className="h-20"
            style={{ background: color }}
            title={color}
            aria-label={color}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {colors.map((color) => (
          <span key={color} className="font-mono text-xs text-slate-500">
            {color}
          </span>
        ))}
      </div>
    </div>
  );
}
