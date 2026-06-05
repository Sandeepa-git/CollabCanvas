import type { AnalysisResult, BoardRecord } from "@/lib/types";

// In-memory store for demonstration purposes
let boards: BoardRecord[] = [];

function recordFromAnalysis(analysis: AnalysisResult): BoardRecord {
  const createdAt = analysis.createdAt ?? new Date().toISOString();
  const id = analysis.id ?? crypto.randomUUID();
  const topics = Array.isArray(analysis.workIQ?.topics) ? analysis.workIQ.topics : [];
  const title =
    analysis.title ??
    (topics.length > 0 ? topics.slice(0, 3).join(" / ") : `Board ${new Date(createdAt).toLocaleDateString()}`);
  const sourceType = analysis.sourceType ?? "text";
  
  const normalized: AnalysisResult = { 
    ...analysis, 
    id, 
    title, 
    createdAt, 
    sourceType,
    workIQ: {
      participants: Array.isArray(analysis.workIQ?.participants) ? analysis.workIQ.participants : [],
      topics: topics,
      deadlines: Array.isArray(analysis.workIQ?.deadlines) ? analysis.workIQ.deadlines : []
    }
  };

  return {
    id,
    title,
    createdAt,
    sourceType,
    summary: normalized.summary,
    sentiment: normalized.sentiment,
    sentimentScore: normalized.sentimentScore,
    topics: topics,
    analysis: normalized
  };
}

export async function saveBoard(analysis: AnalysisResult) {
  const record = recordFromAnalysis(analysis);
  const existingIndex = boards.findIndex(b => b.id === record.id);
  if (existingIndex >= 0) {
    boards[existingIndex] = record;
  } else {
    boards.push(record);
  }
  return record;
}

export async function listBoards(searchQuery = "", sentiment = "all") {
  let sortedBoards = [...boards].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return sortedBoards.filter((board) => {
    const haystack = `${board.title} ${board.summary} ${board.topics.join(" ")}`.toLowerCase();
    const matchesQuery = !searchQuery || haystack.includes(searchQuery.toLowerCase());
    const matchesSentiment = sentiment === "all" || board.sentiment === sentiment;
    return matchesQuery && matchesSentiment;
  });
}
