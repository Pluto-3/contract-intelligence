import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "./middleware/logger.js";
import health from "./routes/health.js";
import upload from "./routes/upload.js";
import { config } from "./config/index.js";

const app = new Hono();

app.use("*", logger);

app.route("/health", health);
app.route("/api/upload", upload);

app.notFound((c) => c.json({ error: "Route not found" }, 404));

app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`);
  return c.json({ error: "Internal server error" }, 500);
});

serve(
  { fetch: app.fetch, port: config.port },
  () => console.log(`Server running on http://localhost:${config.port}`)
);