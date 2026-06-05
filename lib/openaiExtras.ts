import OpenAI from "openai";

export async function createEmbeddingPreview(client: OpenAI, text: string) {
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? "text-embedding-004";
  try {
    const response = await client.embeddings.create({
      model,
      input: text.slice(0, 8000)
    });
    const vector = response.data[0]?.embedding ?? [];

    return {
      model,
      dimensions: vector.length,
      preview: vector.slice(0, 8)
    };
  } catch (error) {
    console.warn("Embedding API call failed, using mock fallback:", error);
    return {
      model: `${model} (fallback)`,
      dimensions: 1536,
      preview: [0.015, -0.024, 0.087, -0.043, 0.052, -0.011, 0.009, -0.076]
    };
  }
}

export async function createBackgroundArt(client: OpenAI, prompt: string) {
  if (process.env.ENABLE_DALLE_BACKGROUND !== "true") {
    return undefined;
  }

  const response = await client.images.generate({
    model: "dall-e-3",
    size: "1024x1024",
    quality: "standard",
    n: 1,
    prompt: `Abstract collaborative mood board background. Themes: ${prompt.slice(0, 420)}`
  });

  return response.data?.[0]?.url;
}
