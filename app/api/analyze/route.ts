import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildMockAnalysis, paletteForSentiment } from "@/lib/mockAnalysis";
import { saveBoard } from "@/lib/boardStore";
import { enrichWithFabricIQ, enrichWithWorkIQ, enrichWithFoundryIQ } from "@/lib/iq";
import { createBackgroundArt } from "@/lib/openaiExtras";
import type { AnalysisResult } from "@/lib/types";

const systemPrompt = `You analyze team meeting notes and chat logs for CollabCanvas.
Return strict JSON only. Extract a concise summary, keywords, themes, sentiment, Work IQ context
(participants, deadlines, topics), Fabric IQ semantic groups (design, engineering, marketing,
operations, strategy), and concept links. Use no Markdown.`;

function mergeAnalysisResults(
  a: Omit<AnalysisResult, "palette">,
  b: Omit<AnalysisResult, "palette">
): Omit<AnalysisResult, "palette"> {
  // 1. Summary: choose the longer, more detailed summary
  const summary = (a.summary || "").length >= (b.summary || "").length
    ? a.summary
    : b.summary;

  // 2. Sentiment: average the scores and resolve label
  const sentimentScore = ((a.sentimentScore ?? 0) + (b.sentimentScore ?? 0)) / 2;
  let sentiment: AnalysisResult["sentiment"] = "neutral";
  if (sentimentScore > 0.25) sentiment = "positive";
  else if (sentimentScore < -0.25) sentiment = "negative";

  // 3. Keywords: merge and deduplicate
  const keywords = Array.from(new Set([
    ...(a.keywords || []),
    ...(b.keywords || [])
  ]));

  // 4. Themes: merge weights and deduplicate
  const themeMap = new Map<string, { label: string; weight: number; group: any }>();
  const addThemes = (themesList: any[] | undefined) => {
    if (!themesList) return;
    for (const theme of themesList) {
      if (!theme || !theme.label) continue;
      const key = theme.label.toLowerCase().trim();
      const existing = themeMap.get(key);
      if (existing) {
        existing.weight = Math.round((existing.weight + theme.weight) / 2);
      } else {
        themeMap.set(key, { ...theme });
      }
    }
  };
  addThemes(a.themes);
  addThemes(b.themes);
  const themes = Array.from(themeMap.values()) as AnalysisResult["themes"];

  // 5. Semantic Clusters: merge keyword arrays
  const semanticClusters: Record<string, string[]> = {};
  const addClusters = (clusters: Record<string, string[]> | undefined) => {
    if (!clusters) return;
    for (const [clusterName, keywordsList] of Object.entries(clusters)) {
      const canonicalName = clusterName.toLowerCase().trim();
      const existingKey = Object.keys(semanticClusters).find(k => k.toLowerCase() === canonicalName);
      if (existingKey) {
        semanticClusters[existingKey] = Array.from(new Set([
          ...semanticClusters[existingKey],
          ...keywordsList
        ]));
      } else {
        semanticClusters[clusterName] = [...keywordsList];
      }
    }
  };
  addClusters(a.semanticClusters);
  addClusters(b.semanticClusters);

  // 6. Work IQ: merge participants, deadlines, topics
  const workIQ = {
    participants: Array.from(new Set([
      ...(a.workIQ?.participants || []),
      ...(b.workIQ?.participants || [])
    ])),
    deadlines: Array.from(new Set([
      ...(a.workIQ?.deadlines || []),
      ...(b.workIQ?.deadlines || [])
    ])),
    topics: Array.from(new Set([
      ...(a.workIQ?.topics || []),
      ...(b.workIQ?.topics || [])
    ]))
  };

  // 7. Fabric IQ Groups: merge arrays for each preset category
  const categories = ["design", "engineering", "marketing", "operations", "strategy"] as const;
  const fabricIQGroups: Record<string, string[]> = {};
  for (const cat of categories) {
    fabricIQGroups[cat] = Array.from(new Set([
      ...(a.fabricIQGroups?.[cat] || []),
      ...(b.fabricIQGroups?.[cat] || [])
    ]));
  }

  // 8. Concept Links: merge and deduplicate links
  const linkMap = new Map<string, { source: string; target: string; label: string }>();
  const addLinks = (links: any[] | undefined) => {
    if (!links) return;
    for (const link of links) {
      if (!link || !link.source || !link.target) continue;
      const key = `${link.source.toLowerCase().trim()}->${link.target.toLowerCase().trim()}`;
      linkMap.set(key, link);
    }
  };
  addLinks(a.conceptLinks);
  addLinks(b.conceptLinks);
  const conceptLinks = Array.from(linkMap.values());

  return {
    summary,
    sentiment,
    sentimentScore,
    keywords,
    themes,
    semanticClusters,
    workIQ,
    fabricIQGroups,
    conceptLinks
  };
}

// 1. Google Gemini Native API Call (avoids OpenAI compatibility layer key-format 404 bugs)
async function queryGeminiNative(
  apiKey: string,
  modelName: string | undefined,
  defaultModel: string,
  text: string
): Promise<Omit<AnalysisResult, "palette"> | null> {
  const model = modelName || defaultModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nAnalyze this collaboration text and fit this JSON shape:
{
  "summary": "string",
  "sentiment": "positive | neutral | negative",
  "sentimentScore": -1 to 1,
  "keywords": ["string"],
  "themes": [{"label":"string","weight":0-100,"group":"design|engineering|marketing|operations|strategy"}],
  "semanticClusters": {"cluster name":["keyword"]},
  "workIQ": {"participants":["string"],"deadlines":["string"],"topics":["string"]},
  "fabricIQGroups": {"design":["string"],"engineering":["string"],"marketing":["string"],"operations":["string"],"strategy":["string"]},
  "conceptLinks": [{"source":"string","target":"string","label":"string"}]
}

Text:
${text}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini native call returned status ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!contentText) {
      return null;
    }
    return JSON.parse(contentText) as Omit<AnalysisResult, "palette">;
  } catch (err) {
    console.error(`Gemini Native call failed for model ${model}:`, err);
    return null;
  }
}

// 2. Google Gemini Native Embedding API Call
async function createGeminiNativeEmbedding(
  apiKey: string,
  text: string
) {
  const model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: [{ text: text.slice(0, 8000) }]
        }
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Embedding status ${response.status}: ${errText}`);
    }

    const data = await response.json() as any;
    const vector = data?.embedding?.values ?? [];
    return {
      model,
      dimensions: vector.length,
      preview: vector.slice(0, 8)
    };
  } catch (error) {
    console.warn("Gemini native embedding call failed, using mock fallback:", error);
    return {
      model: `${model} (fallback)`,
      dimensions: 1536,
      preview: [0.015, -0.024, 0.087, -0.043, 0.052, -0.011, 0.009, -0.076]
    };
  }
}

// 3. OpenRouter Client Call (Uses standard OpenAI SDK wrapper)
async function queryOpenRouter(
  client: OpenAI | null,
  modelName: string | undefined,
  defaultModel: string,
  text: string
): Promise<Omit<AnalysisResult, "palette"> | null> {
  if (!client) return null;
  const model = modelName || defaultModel;
  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this collaboration text and fit this JSON shape:
{
  "summary": "string",
  "sentiment": "positive | neutral | negative",
  "sentimentScore": -1 to 1,
  "keywords": ["string"],
  "themes": [{"label":"string","weight":0-100,"group":"design|engineering|marketing|operations|strategy"}],
  "semanticClusters": {"cluster name":["keyword"]},
  "workIQ": {"participants":["string"],"deadlines":["string"],"topics":["string"]},
  "fabricIQGroups": {"design":["string"],"engineering":["string"],"marketing":["string"],"operations":["string"],"strategy":["string"]},
  "conceptLinks": [{"source":"string","target":"string","label":"string"}]
}

Text:
${text}`
        }
      ]
    }, {
      timeout: 8000
    });

    const content = response.choices[0]?.message.content;
    if (!content) return null;
    return JSON.parse(content) as Omit<AnalysisResult, "palette">;
  } catch (err) {
    console.error(`OpenRouter Analysis: Model ${model} call failed:`, err);
    return null;
  }
}

export async function POST(request: Request) {
  const { text, sourceType = "text" } = (await request.json()) as {
    text?: string;
    sourceType?: AnalysisResult["sourceType"];
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // If neither key is provided, run in complete Mock Mode
  if (!geminiKey && !openRouterKey) {
    const mockData = buildMockAnalysis(text);
    const foundryIQ = await enrichWithFoundryIQ(text, mockData.keywords);
    const mock = {
      ...mockData,
      sourceType,
      foundryIQ,
      semanticClusters: mockData.fabricIQGroups
    };
    const board = await saveBoard(mock);
    return NextResponse.json(board.analysis);
  }

  try {
    // 1. Initialize OpenRouter client if key is present
    const openRouterClient = openRouterKey
      ? new OpenAI({
          apiKey: openRouterKey,
          baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"
        })
      : null;

    // 2. Query Google Gemini Direct (using native REST API to accept AQ.Ab key formats)
    const geminiPromise = geminiKey
      ? queryGeminiNative(
          geminiKey,
          process.env.GEMINI_MODEL,
          "gemini-1.5-flash",
          text
        )
      : Promise.resolve(null);

    // 3. Query OpenRouter (defaulting to the universal openrouter/free wrapper)
    const openRouterPromise = openRouterKey
      ? queryOpenRouter(
          openRouterClient,
          process.env.OPENROUTER_MODEL,
          "openrouter/free",
          text
        )
      : Promise.resolve(null);

    // 4. Query native Gemini embedding if key is present
    const embeddingPromise = geminiKey
      ? createGeminiNativeEmbedding(geminiKey, text)
      : Promise.resolve(undefined);

    const [geminiResult, openRouterResult, embeddings] = await Promise.all([
      geminiPromise,
      openRouterPromise,
      embeddingPromise
    ]);

    // Handle results
    if (!geminiResult && !openRouterResult) {
      throw new Error("Both Gemini and OpenRouter API calls returned empty or failed.");
    }

    let parsed: Omit<AnalysisResult, "palette">;
    if (geminiResult && openRouterResult) {
      parsed = mergeAnalysisResults(geminiResult, openRouterResult);
    } else {
      parsed = (geminiResult || openRouterResult) as Omit<AnalysisResult, "palette">;
    }

    // Enrich with IQ endpoints if configured, otherwise fall back to parsed values
    const workIQ = await enrichWithWorkIQ(text, parsed.workIQ);
    const fabricIQGroups = await enrichWithFabricIQ(text, parsed, parsed.fabricIQGroups);
    const foundryIQ = await enrichWithFoundryIQ(text, parsed.keywords);

    // Call background art generation using OpenRouter client as fallback if needed
    const activeClient = openRouterClient;
    const backgroundImageUrl = activeClient
      ? await createBackgroundArt(activeClient, parsed.keywords.join(", "))
      : undefined;

    const analysis = {
      ...parsed,
      sourceType,
      workIQ,
      fabricIQGroups,
      foundryIQ,
      semanticClusters: parsed.semanticClusters ?? fabricIQGroups,
      palette: paletteForSentiment(parsed.sentiment),
      embeddings,
      backgroundImageUrl
    } satisfies AnalysisResult;

    const board = await saveBoard(analysis);
    return NextResponse.json(board.analysis);
  } catch (error) {
    console.error("Ensemble API handler failed, falling back to mock mode:", error);
    const mockData = buildMockAnalysis(text);
    const foundryIQ = await enrichWithFoundryIQ(text, mockData.keywords);
    const fallback = {
      ...mockData,
      sourceType,
      foundryIQ,
      semanticClusters: mockData.fabricIQGroups
    };
    const board = await saveBoard(fallback);
    return NextResponse.json(board.analysis);
  }
}
