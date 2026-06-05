import { db } from "./firebase";
import { collection, doc, setDoc, getDocs, query, orderBy } from "firebase/firestore";
import type { AnalysisResult, BoardRecord } from "@/lib/types";

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
  // Write the record to Firestore document under the "boards" collection using its unique ID
  await setDoc(doc(db, "boards", record.id), record);
  return record;
}

export async function listBoards(searchQuery = "", sentiment = "all") {
  try {
    const boardsCol = collection(db, "boards");
    // Query the boards ordered by createdAt descending
    const q = query(boardsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    const boards = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as BoardRecord;
      return {
        ...data,
        topics: Array.isArray(data.topics) ? data.topics : [],
        createdAt: data.createdAt ?? new Date().toISOString(),
        sentiment: data.sentiment ?? "neutral",
        sentimentScore: typeof data.sentimentScore === "number" ? data.sentimentScore : 0
      };
    });

    return boards.filter((board) => {
      const haystack = `${board.title} ${board.summary} ${board.topics.join(" ")}`.toLowerCase();
      const matchesQuery = !searchQuery || haystack.includes(searchQuery.toLowerCase());
      const matchesSentiment = sentiment === "all" || board.sentiment === sentiment;
      return matchesQuery && matchesSentiment;
    });
  } catch (error) {
    console.error("Firestore listBoards error:", error);
    return [];
  }
}
