import { ChromaClient } from "chromadb";
import { config } from "../config/index.js";

export const chromaClient = new ChromaClient({
  path: config.chromaUrl,
  fetchOptions: {
    headers: {}
  }
});

export const COLLECTION_NAME = "contract_chunks";

export const getCollection = async () => {
  const collection = await chromaClient.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { "hnsw:space": "cosine" },
  });
  return collection;
};

export const checkChromaConnection = async (): Promise<boolean> => {
  try {
    await chromaClient.heartbeat();
    return true;
  } catch {
    return false;
  }
};