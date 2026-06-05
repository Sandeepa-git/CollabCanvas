import chroma from "chroma-js";
import type { AnalysisResult, Sentiment, Theme } from "@/lib/types";

const groupHints: Record<Theme["group"], string[]> = {
  design: ["design", "brand", "ui", "ux", "visual", "prototype", "flow", "research"],
  engineering: ["api", "bug", "data", "backend", "frontend", "deploy", "system", "build"],
  marketing: ["marketing", "launch", "campaign", "audience", "growth", "content", "social", "positioning"],
  operations: ["deadline", "owner", "handoff", "timeline", "risk", "meeting", "budget"],
  strategy: ["goal", "vision", "priority", "roadmap", "customer", "market", "decision"]
};

const stopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "because",
  "but",
  "can",
  "for",
  "from",
  "have",
  "into",
  "meeting",
  "notes",
  "our",
  "that",
  "the",
  "their",
  "there",
  "this",
  "todo",
  "was",
  "with",
  "will",
  "would"
]);

export function paletteForSentiment(sentiment: Sentiment) {
  const anchors = {
    positive: ["#0f766e", "#22c55e", "#facc15", "#f97316"],
    neutral: ["#2563eb", "#14b8a6", "#a3e635", "#f8fafc"],
    negative: ["#7f1d1d", "#e11d48", "#fb7185", "#f8fafc"]
  };

  return chroma.scale(anchors[sentiment]).mode("lch").colors(6);
}

export function categorizeTheme(label: string): Theme["group"] {
  const lower = label.toLowerCase();
  const match = Object.entries(groupHints).find(([, hints]) =>
    hints.some((hint) => lower.includes(hint))
  );

  return (match?.[0] as Theme["group"]) ?? "strategy";
}

export function buildMockAnalysis(input: string): AnalysisResult {
  const participants = Array.from(input.matchAll(/@?([A-Z][a-z]+)\s*:/g)).map((match) => match[1]);
  const participantWords = new Set(participants.map((participant) => participant.toLowerCase()));
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word) && !participantWords.has(word));

  const counts = words.reduce<Record<string, number>>((acc, word) => {
    acc[word] = (acc[word] ?? 0) + 1;
    return acc;
  }, {});

  const keywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);

  const positiveHits = ["love", "great", "win", "excited", "clear", "aligned", "happy"].filter((word) =>
    input.toLowerCase().includes(word)
  ).length;
  const negativeHits = ["risk", "blocked", "delay", "concern", "issue", "hard", "miss"].filter((word) =>
    input.toLowerCase().includes(word)
  ).length;
  const sentiment: Sentiment =
    positiveHits > negativeHits ? "positive" : negativeHits > positiveHits ? "negative" : "neutral";

  const themes = keywords.slice(0, 8).map((keyword, index) => ({
    label: keyword,
    weight: Math.max(20, 90 - index * 8),
    group: categorizeTheme(keyword)
  }));

  const deadlines = Array.from(
    input.matchAll(/\b(?:by|before|due)\s+([A-Z]?[a-z]+day|\d{1,2}\/\d{1,2}|\w+\s+\d{1,2})/gi)
  ).map((match) => match[1]);

  const fabricIQGroups = themes.reduce<Record<string, string[]>>((acc, theme) => {
    acc[theme.group] = [...(acc[theme.group] ?? []), theme.label];
    return acc;
  }, {});

  return {
    summary:
      input.length > 180
        ? `${input.slice(0, 177).trim()}...`
        : input || "Paste meeting notes to generate a team mood board.",
    sentiment,
    sentimentScore: sentiment === "positive" ? 0.78 : sentiment === "negative" ? -0.62 : 0.08,
    keywords,
    themes,
    workIQ: {
      participants: Array.from(new Set(participants)).slice(0, 6),
      deadlines: Array.from(new Set(deadlines)).slice(0, 5),
      topics: keywords.slice(0, 6)
    },
    fabricIQGroups,
    conceptLinks: themes.slice(1, 7).map((theme) => ({
      source: themes[0]?.label ?? "collaboration",
      target: theme.label,
      label: theme.group
    })),
    palette: paletteForSentiment(sentiment)
  };
}
