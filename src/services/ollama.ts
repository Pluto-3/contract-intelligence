import { config } from "../config/index.js";

export const checkOllamaConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${config.ollamaUrl}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const res = await fetch(`${config.ollamaUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollamaEmbedModel,
      prompt: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama embedding failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { embedding: number[] };

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error(`Ollama embedding returned unexpected format: ${JSON.stringify(data)}`);
  }

  return data.embedding;
};

export const generate = async (prompt: string, system?: string): Promise<string> => {
  const res = await fetch(`${config.ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollamaModel,
      prompt,
      system: system ?? "",
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama generate failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response;
};