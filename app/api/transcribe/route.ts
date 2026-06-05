import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Upload an audio file in the 'audio' field." }, { status: 400 });
  }

  if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
    return NextResponse.json({
      text: `[Demo transcription placeholder for ${audio.name}] Add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to enable Azure Speech-to-Text.`
    });
  }

  const endpoint = `https://${process.env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY,
      "Content-Type": audio.type || "audio/wav",
      Accept: "application/json"
    },
    body: await audio.arrayBuffer()
  });

  if (!response.ok) {
    return NextResponse.json({ error: `Azure transcription failed with ${response.status}.` }, { status: 502 });
  }

  const result = (await response.json()) as { DisplayText?: string; NBest?: Array<{ Display?: string }> };
  return NextResponse.json({ text: result.DisplayText ?? result.NBest?.[0]?.Display ?? "" });
}
