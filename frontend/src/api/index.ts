import axios from "axios";
import type { Contract, Clause, Message, QAResponse } from "../types/index";

const api = axios.create({
  baseURL: "/api",
});

export const uploadContract = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/upload", form);
  return res.data as { contractId: string; status: string; chunkCount: number };
};

export const getContract = async (id: string) => {
  const res = await api.get(`/contracts/${id}`);
  return res.data as { contract: Contract; clauses: Clause[] };
};

export const getContractStatus = async (id: string) => {
  const res = await api.get(`/contracts/${id}/status`);
  return res.data as { id: string; status: string };
};

export const askQuestion = async (contractId: string, question: string) => {
  const res = await api.post(`/contracts/${contractId}/ask`, { question });
  return res.data as QAResponse;
};

export const getSession = async (contractId: string) => {
  const res = await api.get(`/contracts/${contractId}/session`);
  return res.data as { sessionId: string; messages: Message[] };
};

export const submitFeedback = async (
  messageId: string,
  rating: 0 | 1,
  comment?: string
) => {
  const res = await api.post(`/feedback/${messageId}`, { rating, comment });
  return res.data;
};