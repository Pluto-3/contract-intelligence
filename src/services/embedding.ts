import { getCollection } from "./chroma.js";
import { generateEmbedding } from "./ollama.js";
import type { Chunk } from "../lib/chunker.js";

// ── Store Chunks ─────────────────────────────────────────────

export const storeChunks = async (
  contractId: string,
  chunks: Chunk[]
): Promise<void> => {
  const collection = await getCollection();

  const ids: string[] = [];
  const embeddings: number[][] = [];
  const documents: string[] = [];
  const metadatas: object[] = [];

  console.log(`[EMBED] Embedding ${chunks.length} chunks for contract ${contractId}`);

  for (const chunk of chunks) {
    const id = `${contractId}_chunk_${chunk.index}`;
    const embedding = await generateEmbedding(chunk.text);

    ids.push(id);
    embeddings.push(embedding);
    documents.push(chunk.text);
    metadatas.push({
      contractId,
      chunkIndex: chunk.index,
      charStart: chunk.charStart,
      charEnd: chunk.charEnd,
    });

    console.log(`[EMBED] Chunk ${chunk.index + 1}/${chunks.length} done`);
  }

  await collection.add({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  console.log(`[EMBED] Stored ${chunks.length} chunks in ChromaDB`);
};

// ── Query Similar Chunks ─────────────────────────────────────

export interface SimilarChunk {
  text: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  distance: number;
}

export const querySimilarChunks = async (
  contractId: string,
  question: string,
  topK: number = 5
): Promise<SimilarChunk[]> => {
  const collection = await getCollection();
  const questionEmbedding = await generateEmbedding(question);

  const results = await collection.query({
    queryEmbeddings: [questionEmbedding],
    nResults: topK,
    where: { contractId },
  });

  if (!results.documents[0]) return [];

  return results.documents[0].map((text, i) => ({
    text: text ?? "",
    chunkIndex: (results.metadatas[0]?.[i] as any)?.chunkIndex ?? i,
    charStart: (results.metadatas[0]?.[i] as any)?.charStart ?? 0,
    charEnd: (results.metadatas[0]?.[i] as any)?.charEnd ?? 0,
    distance: results.distances?.[0]?.[i] ?? 1,
  }));
};

// ── Delete Contract Chunks ───────────────────────────────────

export const deleteContractChunks = async (
  contractId: string
): Promise<void> => {
  const collection = await getCollection();
  await collection.delete({ where: { contractId } });
  console.log(`[EMBED] Deleted chunks for contract ${contractId}`);
};
