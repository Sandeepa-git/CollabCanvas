import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    gemini: !!process.env.GEMINI_API_KEY,
    openRouter: !!process.env.OPENROUTER_API_KEY,
    azureSpeech: !!process.env.AZURE_SPEECH_KEY
  });
}
