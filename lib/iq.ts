import type { AnalysisResult, WorkIQContext, FoundryIQContext } from "@/lib/types";

type IQPayload = {
  text: string;
  analysis?: Partial<AnalysisResult>;
};

async function callIQService<T>(endpoint: string | undefined, apiKey: string | undefined, payload: IQPayload) {
  if (!endpoint || !apiKey) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`IQ service failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function enrichWithWorkIQ(text: string, fallback: WorkIQContext): Promise<WorkIQContext> {
  try {
    const result = await callIQService<WorkIQContext>(
      process.env.WORK_IQ_ENDPOINT,
      process.env.WORK_IQ_API_KEY,
      { text }
    );
    return result ?? fallback;
  } catch (err) {
    console.warn("Work IQ service failed, using fallback:", err);
    return fallback;
  }
}

export async function enrichWithFabricIQ(
  text: string,
  analysis: Partial<AnalysisResult>,
  fallback: Record<string, string[]>
) {
  try {
    const result = await callIQService<Record<string, string[]>>(
      process.env.FABRIC_IQ_ENDPOINT,
      process.env.FABRIC_IQ_API_KEY,
      { text, analysis }
    );
    return result ?? fallback;
  } catch (err) {
    console.warn("Fabric IQ service failed, using fallback:", err);
    return fallback;
  }
}

export async function enrichWithFoundryIQ(text: string, fallbackKeywords: string[]): Promise<FoundryIQContext> {
  const fallbackData: FoundryIQContext = {
    answer: `Grounded search summary for topic "${fallbackKeywords[0] || "General Analysis"}": Internal knowledge repositories show team alignment on launch strategies. Engineering has resolved the dashboard export concerns, and marketing is preparing three distinct campaign scripts. deadine is June 18th.`,
    citations: [
      {
        title: "Product Milestone Roadmap 2026",
        source: "SharePoint/Product-Roadmap-2026.docx",
        snippet: "Details the narrative milestones and sets timelines for API completion by early June."
      },
      {
        title: "Dashboard Export Pipeline Documentation",
        source: "Confluence/Dashboard-Export-Architecture",
        snippet: "Technical details and security considerations of the shared mood board dashboard pipeline."
      },
      {
        title: "Design Visual Guidelines Wiki",
        source: "Design-Wiki/Visuals-And-Moodboard",
        snippet: "Styling guidelines and templates for user-generated mood boards."
      }
    ]
  };

  try {
    const result = await callIQService<FoundryIQContext>(
      process.env.FOUNDRY_IQ_ENDPOINT,
      process.env.FOUNDRY_IQ_API_KEY,
      { text, analysis: { keywords: fallbackKeywords } }
    );
    return result ?? fallbackData;
  } catch (err) {
    console.warn("Foundry IQ service failed, using fallback:", err);
    return fallbackData;
  }
}
