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

export const chat = async (
  userMessage: string,
  systemMessage: string
): Promise<string> => {
  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollamaModel,
      stream: false,
      options: {
        num_ctx: 2048,
        temperature: 0,
      },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama chat failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { message: { content: string } };
  return data.message.content;
};

export const unloadModel = async (model: string): Promise<void> => {
  await fetch(`${config.ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      keep_alive: 0,
    }),
  });
  console.log(`[OLLAMA] Unloaded model: ${model}`);
};