import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import initSqlJs, { Database } from "sql.js";
import type { AnalysisResult, BoardRecord } from "@/lib/types";

const isVercel = !!process.env.VERCEL;
const dataDir = isVercel ? "/tmp" : path.join(process.cwd(), ".data");
const dbPath = path.join(dataDir, "collabcanvas.sqlite");

let dbPromise: Promise<Database> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    }).then((SQL) => {
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      const db = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : new SQL.Database();
      db.run(`
        CREATE TABLE IF NOT EXISTS boards (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          created_at TEXT NOT NULL,
          source_type TEXT NOT NULL,
          summary TEXT NOT NULL,
          sentiment TEXT NOT NULL,
          sentiment_score REAL NOT NULL,
          topics TEXT NOT NULL,
          analysis_json TEXT NOT NULL
        );
      `);
      persistDb(db);
      return db;
    });
  }

  return dbPromise;
}

function persistDb(db: Database) {
  writeFileSync(dbPath, Buffer.from(db.export()));
}

function recordFromAnalysis(analysis: AnalysisResult): BoardRecord {
  const createdAt = analysis.createdAt ?? new Date().toISOString();
  const title =
    analysis.title ??
    analysis.workIQ.topics.slice(0, 3).join(" / ") ??
    `Board ${new Date(createdAt).toLocaleDateString()}`;
  const id = analysis.id ?? crypto.randomUUID();
  const sourceType = analysis.sourceType ?? "text";
  const normalized: AnalysisResult = { ...analysis, id, title, createdAt, sourceType };

  return {
    id,
    title,
    createdAt,
    sourceType,
    summary: normalized.summary,
    sentiment: normalized.sentiment,
    sentimentScore: normalized.sentimentScore,
    topics: normalized.workIQ.topics,
    analysis: normalized
  };
}

export async function saveBoard(analysis: AnalysisResult) {
  const db = await getDb();
  const record = recordFromAnalysis(analysis);

  db.run(
    `INSERT OR REPLACE INTO boards
      (id, title, created_at, source_type, summary, sentiment, sentiment_score, topics, analysis_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      record.id,
      record.title,
      record.createdAt,
      record.sourceType,
      record.summary,
      record.sentiment,
      record.sentimentScore,
      JSON.stringify(record.topics),
      JSON.stringify(record.analysis)
    ]
  );
  persistDb(db);

  return record;
}

export async function listBoards(query = "", sentiment = "all") {
  const db = await getDb();
  const rows = db.exec(
    `SELECT id, title, created_at, source_type, summary, sentiment, sentiment_score, topics, analysis_json
     FROM boards
     ORDER BY datetime(created_at) DESC;`
  )[0]?.values ?? [];

  return rows
    .map((row) => ({
      id: String(row[0]),
      title: String(row[1]),
      createdAt: String(row[2]),
      sourceType: row[3] as BoardRecord["sourceType"],
      summary: String(row[4]),
      sentiment: row[5] as BoardRecord["sentiment"],
      sentimentScore: Number(row[6]),
      topics: JSON.parse(String(row[7])) as string[],
      analysis: JSON.parse(String(row[8])) as AnalysisResult
    }))
    .filter((board) => {
      const haystack = `${board.title} ${board.summary} ${board.topics.join(" ")}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesSentiment = sentiment === "all" || board.sentiment === sentiment;
      return matchesQuery && matchesSentiment;
    });
}
