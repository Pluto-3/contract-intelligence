import { db } from "../db/client.js";
import { qaSessions, qaMessages } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { querySimilarChunks } from "./embedding.js";
import { unloadModel } from "./ollama.js";
import { chat } from "./ollama.js";
import { config } from "../config/index.js";
import { generateEmbedding } from "./ollama.js";

const SYSTEM_PROMPT = `You are a contract analysis assistant. Your job is to answer questions about a contract based solely on the contract text provided to you.

Rules you must follow:
- Answer ONLY using the provided contract context
- Never use outside knowledge or assumptions
- If the answer is not in the context, say so explicitly
- Be concise and precise
- Reference the relevant part of the contract when answering`;

const buildQAPrompt = (question: string, chunks: string[]): string => {
  const context = chunks
    .map((chunk, i) => `[Section ${i + 1}]\n${chunk}`)
    .join("\n\n");

  return `CONTRACT CONTEXT:
${context}

QUESTION: ${question}

Answer the question using only the contract context above.`;
};

const assessConfidence = (answer: string, chunks: string[]): "high" | "medium" | "low" => {
  const answerLower = answer.toLowerCase();

  const notFoundPhrases = [
    "not mentioned", "not specified", "not addressed",
    "does not appear", "no information", "cannot find",
    "not found", "unclear", "not stated", "not explicitly",
    "no mention", "not covered", "not included",
  ];

  const hedgePhrases = [
    "it appears", "it seems", "may be", "might be",
    "could be", "possibly", "probably", "suggests",
    "implies", "inferred", "not shown", "not provided",
    "outside the context", "based on general",
  ];

  if (notFoundPhrases.some((p) => answerLower.includes(p))) return "low";
  if (hedgePhrases.some((p) => answerLower.includes(p))) return "medium";
  if (chunks.length === 0) return "low";

  return "high";
};

const applyUncertaintyWrapper = (
  answer: string,
  confidence: "high" | "medium" | "low"
): string => {
  if (confidence === "low") {
    return `This contract does not appear to address this directly. ${answer} If this is important, consult a qualified lawyer.`;
  }

  if (confidence === "medium") {
    return `${answer} Please review the relevant clause directly before relying on this.`;
  }

  return answer;
};

export const getOrCreateSession = async (contractId: string): Promise<string> => {
  const existing = await db
    .select()
    .from(qaSessions)
    .where(eq(qaSessions.contractId, contractId))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [session] = await db
    .insert(qaSessions)
    .values({ contractId })
    .returning();

  return session!.id;
};

export const askQuestion = async (
  contractId: string,
  question: string
): Promise<{
  answer: string;
  confidence: "high" | "medium" | "low";
  chunksUsed: number[];
  sessionId: string;
}> => {
  console.log(`[QA] Question for contract ${contractId}: "${question}"`);

  const sessionId = await getOrCreateSession(contractId);
  const chunks = await querySimilarChunks(contractId, question, 5);

  if (chunks.length === 0) {
    const fallbackAnswer = "No relevant sections were found in this contract to answer your question.";

    await db.insert(qaMessages).values({ sessionId, role: "user", content: question });
    await db.insert(qaMessages).values({
      sessionId,
      role: "assistant",
      content: fallbackAnswer,
      confidence: "low",
      chunksUsed: [],
    });

    return { answer: fallbackAnswer, confidence: "low", chunksUsed: [], sessionId };
  }

  const chunkTexts = chunks.map((c) => c.text);
  const chunkIndexes = chunks.map((c) => c.chunkIndex);
  const prompt = buildQAPrompt(question, chunkTexts);

  await unloadModel(config.ollamaEmbedModel);
  const rawAnswer = await chat(prompt, SYSTEM_PROMPT);

  const confidence = assessConfidence(rawAnswer, chunkTexts);
  const answer = applyUncertaintyWrapper(rawAnswer, confidence);

  await db.insert(qaMessages).values({ sessionId, role: "user", content: question });
  await db.insert(qaMessages).values({
    sessionId,
    role: "assistant",
    content: answer,
    confidence,
    chunksUsed: chunkIndexes,
  });

  console.log(`[QA] Answered. Confidence: ${confidence}`);
  return { answer, confidence, chunksUsed: chunkIndexes, sessionId };
};

export const getSession = async (contractId: string) => {
  const sessionId = await getOrCreateSession(contractId);

  const messages = await db
    .select()
    .from(qaMessages)
    .where(eq(qaMessages.sessionId, sessionId))
    .orderBy(qaMessages.createdAt);

  return { sessionId, messages };
};