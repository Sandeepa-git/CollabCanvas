import { NextResponse } from "next/server";
import { listBoards, saveBoard } from "@/lib/boardStore";
import type { AnalysisResult } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boards = await listBoards(searchParams.get("q") ?? "", searchParams.get("sentiment") ?? "all");
  return NextResponse.json({ boards });
}

export async function POST(request: Request) {
  const analysis = (await request.json()) as AnalysisResult;
  const board = await saveBoard(analysis);
  return NextResponse.json(board);
}
