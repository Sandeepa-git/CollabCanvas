import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const geminiKey = !!process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL ?? null;
  const geminiEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? null;

  const openRouterKey = !!process.env.OPENROUTER_API_KEY;
  const openRouterBase = process.env.OPENROUTER_BASE_URL ?? null;
  const openRouterModel = process.env.OPENROUTER_MODEL ?? null;
  const disableOpenRouter = process.env.DISABLE_OPENROUTER === "true";

  const azureOpenAIKey = !!process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT ?? null;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? null;

  const azureSpeech = !!process.env.AZURE_SPEECH_KEY && !!process.env.AZURE_SPEECH_REGION;

  const anyLLM = geminiKey || (openRouterKey && !disableOpenRouter) || azureOpenAIKey;

  return NextResponse.json({
    gemini: geminiKey,
    geminiModel,
    geminiEmbeddingModel,
    openRouter: openRouterKey,
    openRouterBase,
    openRouterModel,
    disableOpenRouter,
    azureOpenAI: azureOpenAIKey,
    azureEndpoint,
    azureDeployment,
    azureSpeech,
    anyLLM
  });
}
