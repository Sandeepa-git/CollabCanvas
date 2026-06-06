import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.error("Client log:", JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("Failed to parse client log:", err);
  }

  return NextResponse.json({ ok: true });
}
