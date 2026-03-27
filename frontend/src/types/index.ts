export interface Contract {
  id: string;
  filename: string;
  fileType: string;
  status: "processing" | "ready" | "failed";
  summary: string | null;
  uploadedAt: string;
  processedAt: string | null;
}

export interface Clause {
  id: string;
  contractId: string;
  type: string;
  rawText: string;
  explanation: string;
  riskLevel: "low" | "medium" | "high";
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  confidence: "high" | "medium" | "low" | null;
  chunksUsed: number[] | null;
  createdAt: string;
}

export interface QAResponse {
  answer: string;
  confidence: "high" | "medium" | "low";
  chunksUsed: number[];
  sessionId: string;
}