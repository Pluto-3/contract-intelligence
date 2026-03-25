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

  if (!res.ok) throw new Error(`Ollama embedding failed: ${res.statusText}`);
  const data = (await res.json()) as { embedding: number[] };
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

  if (!res.ok) throw new Error(`Ollama generate failed: ${res.statusText}`);
  const data = (await res.json()) as { response: string };
  return data.response;
};