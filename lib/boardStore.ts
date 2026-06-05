import type { AnalysisResult, BoardRecord } from "@/lib/types";
// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy, terminate } from "firebase/firestore";

/*
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCqq33EG5vKa_biTSLHjKyNe-wvD5qDwNc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "collabcanvas-5b994.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "collabcanvas-5b994",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "collabcanvas-5b994.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "103330337790",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:103330337790:web:733f2155071c381cd966af"
};

async function executeFirestore<T>(callback: (db: any) => Promise<T>): Promise<T> {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);
  try {
    return await callback(db);
  } finally {
    // Terminate the Firestore database connection to release TCP sockets and background timers.
    await terminate(db).catch(() => {});
  }
}
*/

// Local in-memory board storage cache
const memoryBoards: BoardRecord[] = [];

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
  
  /*
  // Commented out Firestore write:
  return await executeFirestore(async (db) => {
    await setDoc(doc(db, "boards", record.id), record);
    return record;
  });
  */
  
  // In-memory write cache
  memoryBoards.push(record);
  return record;
}

export async function listBoards(searchQuery = "", sentiment = "all") {
  /*
  // Commented out Firestore read:
  return await executeFirestore(async (db) => {
    try {
      const boardsCol = collection(db, "boards");
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
  });
  */

  // In-memory read sorting by date descending
  const sortedBoards = [...memoryBoards].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  
  return sortedBoards.filter((board) => {
    const haystack = `${board.title} ${board.summary} ${board.topics.join(" ")}`.toLowerCase();
    const matchesQuery = !searchQuery || haystack.includes(searchQuery.toLowerCase());
    const matchesSentiment = sentiment === "all" || board.sentiment === sentiment;
    return matchesQuery && matchesSentiment;
  });
}
