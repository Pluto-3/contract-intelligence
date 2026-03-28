import { Hono } from "hono";
import { db } from "../db/client.js";
import { contracts } from "../db/schema.js";
import { processDocument } from "../services/document.js";
import { storeChunks } from "../services/embedding.js"
import { ensureContractDir, getContractFilePath } from "../lib/storage.js";
import { createRequire } from "module";
import fs from "fs/promises";
import { serve } from "@hono/node-server";
import type { IncomingMessage, ServerResponse } from "http";
import { eq } from "drizzle-orm";
import { analyzeContract } from "../services/analysis.js";
import { unloadModel } from "../services/ollama.js";
import { config } from "../config/index.js";

const require = createRequire(import.meta.url);
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const router = new Hono();

router.post("/", async (c) => {
  return new Promise((resolve) => {
    const req = c.env.incoming as IncomingMessage;
    const res = c.env.outgoing as ServerResponse;

    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        resolve(c.json({ error: "File upload failed", detail: err.message }, 400));
        return;
      }

      const file = (req as any).file;

      if (!file) {
        resolve(c.json({ error: "No file provided. Use field name: file" }, 400));
        return;
      }

      const fileType = ALLOWED_TYPES[file.mimetype as string];
      if (!fileType) {
        resolve(c.json({ error: "Unsupported file type. Only PDF and DOCX allowed." }, 400));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        resolve(c.json({ error: "File too large. Maximum size is 10MB." }, 400));
        return;
      }

      // Insert initial contract record
      const [contract] = await db
        .insert(contracts)
        .values({
          filename: file.originalname,
          fileType,
          filePath: "",
          status: "processing",
        })
        .returning();

      if (!contract) {
        resolve(c.json({ error: "Failed to create contract record" }, 500));
        return;
      }

      await assertOllamaReachable();

      try {
        // Save file to disk
        const dir = await ensureContractDir(contract.id);
        const filePath = getContractFilePath(contract.id, file.originalname);
        await fs.writeFile(filePath, file.buffer);

        // Update file path
        await db
          .update(contracts)
          .set({ filePath })
          .where(eq(contracts.id, contract.id));

        // Extract + chunk
        const { rawText, chunks } = await processDocument(filePath, fileType);

        await storeChunks(contract.id, chunks);
        await unloadModel(config.ollamaEmbedModel);
        await analyzeContract(contract.id, rawText);

        await db
          .update(contracts)
          .set({ status: "ready", processedAt: new Date() })
          .where(eq(contracts.id, contract.id));

        resolve(c.json({
          contractId: contract.id,
          filename: file.originalname,
          fileType,
          charCount: rawText.length,
          chunkCount: chunks.length,
          preview: rawText.slice(0, 300),
          status: "ready",
        }, 201));

      } catch (err: any) {
        await db
          .update(contracts)
          .set({ status: "failed" })
          .where(eq(contracts.id, contract.id));

        console.error("[UPLOAD ERROR]", err);
        resolve(c.json({ error: "Failed to process document", detail: err.message }, 500));
      }
    });
  });
});

export const assertOllamaReachable = async (): Promise<void> => {
  const reachable = await checkOllamaConnection();
  if (!reachable) {
    throw new Error("Ollama is not reachable. Make sure it is running on port 11434.");
  }
};

export default router;