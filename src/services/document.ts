import fs from "fs/promises";
import { createRequire } from "module";
import mammoth from "mammoth";
import { chunkText, type Chunk } from "../lib/chunker.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const extractText = async (
  filePath: string,
  fileType: string
): Promise<string> => {
  if (fileType === "pdf") {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return cleanText(result.text);
  }

  if (fileType === "docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return cleanText(result.value);
  }

  throw new Error(`Unsupported file type: ${fileType}`);
};

const cleanText = (raw: string): string => {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{3,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .trim();
};

export const processDocument = async (
  filePath: string,
  fileType: string
): Promise<{ rawText: string; chunks: Chunk[] }> => {
  const rawText = await extractText(filePath, fileType);

  if (!rawText || rawText.length < 50) {
    throw new Error("Document appears to be empty or unreadable");
  }

  const chunks = chunkText(rawText);
  return { rawText, chunks };
};