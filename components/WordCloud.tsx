"use client";

import cloud from "d3-cloud";
import { useEffect, useMemo, useState } from "react";
import type { Theme } from "@/lib/types";

type PositionedWord = Theme & {
  x?: number;
  y?: number;
  rotate?: number;
  size?: number;
};

type WordCloudProps = {
  themes: Theme[];
  colors: string[];
  theme: "dark" | "light";
};

export function WordCloud({ themes, colors, theme }: WordCloudProps) {
  const [words, setWords] = useState<PositionedWord[]>([]);
  const safeThemes = useMemo(() => (themes || []).slice(0, 28), [themes]);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!safeThemes.length) {
      setWords([]);
      return;
    }

    cloud<PositionedWord>()
      .size([620, 320])
      .words(
        safeThemes.map((themeObj) => ({
          ...themeObj,
          text: themeObj.label,
          size: 18 + themeObj.weight * 0.42
        }))
      )
      .padding(6)
      .rotate((_, index) => (index % 5 === 0 ? -18 : index % 3 === 0 ? 14 : 0))
      .font("Inter, ui-sans-serif, system-ui")
      .fontWeight("700")
      .fontSize((word) => word.size ?? 28)
      .on("end", (layoutWords) => setWords(layoutWords))
      .start();
  }, [safeThemes]);

  return (
    <div className={`rounded-xl p-5 shadow-2xl border ${
      isDark ? "glass-panel border-white/5" : "bg-white border-slate-200"
    }`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-400">Theme Cloud</h2>
      <svg
        viewBox="0 0 620 320"
        className={`mt-3 h-80 w-full rounded-lg transition-colors duration-500 border ${
          isDark ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200/60"
        }`}
      >
        <g transform="translate(310,160)">
          {words.map((word, index) => (
            <text
              key={`${word.label}-${index}`}
              textAnchor="middle"
              transform={`translate(${word.x ?? 0},${word.y ?? 0}) rotate(${word.rotate ?? 0})`}
              style={{
                fill: colors[index % colors.length],
                fontSize: word.size,
                fontWeight: 800
              }}
            >
              {word.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
