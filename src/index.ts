const originalWarn = console.warn.bind(console);
console.warn = (...args: any[]) => {
  if (typeof args[0] === "string" && args[0].includes("DefaultEmbeddingFunction")) return;
  originalWarn(...args);
};

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "./middleware/logger.js";
import health from "./routes/health.js";
import upload from "./routes/upload.js";
import { config } from "./config/index.js";
import contracts from "./routes/contracts.js";
import qa from "./routes/qa.js";
import feedback from "./routes/feedback.js";
import riskRouter from "./routes/risk.js";
import actionsRouter from "./routes/actions.js";
import { Agent, setGlobalDispatcher } from "undici";

const globalAgent = new Agent({
  headersTimeout: 20 * 60 * 1000,
  bodyTimeout: 20 * 60 * 1000,
  connectTimeout: 60000,
});

setGlobalDispatcher(globalAgent);
console.log("[INIT] Global Undici Dispatcher set with 20m timeout");

const app = new Hono();

app.use("*", logger);

app.route("/health", health);
app.route("/api/upload", upload);
app.route("/api/contracts", contracts)
app.route("/api/contracts", qa);
app.route("/api/feedback", feedback);
app.route("api/contracts", riskRouter);
app.route("api/contracts", actionsRouter)

app.notFound((c) => c.json({ error: "Route not found" }, 404));

app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);
  return c.json({ error: "Internal server error" }, 500);
});

serve(
  { fetch: app.fetch, port: config.port },
  () => console.log(`Server running on http://localhost:${config.port}`)
);