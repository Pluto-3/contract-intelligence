import { Hono } from "hono";
import { checkDbConnection } from "../db/client.js";
import { checkChromaConnection } from "../services/chroma.js";
import { checkOllamaConnection } from "../services/ollama.js";

const health = new Hono();

health.get("/", async (c) => {
  const [db, chroma, ollama] = await Promise.all([
    checkDbConnection(),
    checkChromaConnection(),
    checkOllamaConnection(),
  ]);

  const allHealthy = db && chroma && ollama;

  return c.json(
    {
      status: allHealthy ? "ok" : "degraded",
      services: {
        database: db ? "ok" : "unreachable",
        chroma: chroma ? "ok" : "unreachable",
        ollama: ollama ? "ok" : "unreachable",
      },
      timestamp: new Date().toISOString(),
    },
    allHealthy ? 200 : 503
  );
});

export default health;