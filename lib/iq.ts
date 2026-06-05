import type { AnalysisResult, WorkIQContext } from "@/lib/types";

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
  const result = await callIQService<WorkIQContext>(
    process.env.WORK_IQ_ENDPOINT,
    process.env.WORK_IQ_API_KEY,
    { text }
  );

  return result ?? fallback;
}

export async function enrichWithFabricIQ(
  text: string,
  analysis: Partial<AnalysisResult>,
  fallback: Record<string, string[]>
) {
  const result = await callIQService<Record<string, string[]>>(
    process.env.FABRIC_IQ_ENDPOINT,
    process.env.FABRIC_IQ_API_KEY,
    { text, analysis }
  );

  return result ?? fallback;
}
