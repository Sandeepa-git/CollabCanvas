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
  const workIQ = !!process.env.WORK_IQ_ENDPOINT && !!process.env.WORK_IQ_API_KEY;
  const fabricIQ = !!process.env.FABRIC_IQ_ENDPOINT && !!process.env.FABRIC_IQ_API_KEY;
  const foundryIQ = !!process.env.FOUNDRY_IQ_ENDPOINT && !!process.env.FOUNDRY_IQ_API_KEY;

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
    workIQ,
    fabricIQ,
    foundryIQ,
    anyLLM
  });
}
