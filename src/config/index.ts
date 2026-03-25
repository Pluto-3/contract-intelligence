import dotenv from "dotenv";
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const config = {
  port: parseInt(process.env.PORT ?? "3000"),
  databaseUrl: requireEnv("DATABASE_URL"),
  chromaUrl: requireEnv("CHROMA_URL"),
  ollamaUrl: requireEnv("OLLAMA_URL"),
  ollamaModel: requireEnv("OLLAMA_MODEL"),
  ollamaEmbedModel: requireEnv("OLLAMA_EMBED_MODEL"),
} as const;