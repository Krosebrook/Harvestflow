import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { nanoid } from "nanoid";
import { promises as fsp } from "fs";
import { Metrics } from "./metrics/store.js";
import { organizeUploadedFiles } from "./dropzone/organizer.js";

const app = express();

const DROPZONE_ROOT = path.resolve(process.env.DROPZONE_ROOT ?? path.join(process.cwd(), "dropzone"));
const INCOMING_DIR = path.join(DROPZONE_ROOT, "incoming");
const SESSIONS_DIR = path.join(DROPZONE_ROOT, "sessions");
const DASHBOARD_DIST = path.join(process.cwd(), "dashboard", "dist");
const HAS_DASHBOARD_ASSETS = fs.existsSync(path.join(DASHBOARD_DIST, "index.html"));
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS;

// ── Security headers ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  next();
});

fs.mkdirSync(INCOMING_DIR, { recursive: true });
fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const upload = multer({ dest: INCOMING_DIR });

// ── Health check (unauthenticated) ───────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

if (BASIC_AUTH_USER && BASIC_AUTH_PASS) {
  app.use((req, res, next) => {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Basic ")) {
      res.setHeader("WWW-Authenticate", "Basic realm=\"HarvestFlow\"");
      return res.status(401).send("Authentication required");
    }
    const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    const user = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
    const pass = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";
    if (user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS) {
      return next();
    }
    res.setHeader("WWW-Authenticate", "Basic realm=\"HarvestFlow\"");
    return res.status(401).send("Invalid credentials");
  });
}

if (HAS_DASHBOARD_ASSETS) {
  app.use(express.static(DASHBOARD_DIST));
}

app.get("/metrics.json", (_req, res) => {
  res.json(Metrics.all());
});

app.get("/", (_req, res) => {
  if (HAS_DASHBOARD_ASSETS) {
    res.sendFile(path.join(DASHBOARD_DIST, "index.html"));
    return;
  }
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Flow Metrics</title></head>
<body style="font-family:system-ui;margin:2rem">
<h1>Flow Metrics</h1>
<p>Last ${Metrics.all().length} samples</p>
<canvas id="chart"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
async function main(){
  const data = await fetch('/metrics.json').then(r=>r.json());
  const byLabel = {};
  data.forEach(d => { (byLabel[d.label] ??= []).push(d); });
  const labels = data.map(d => new Date(d.ts).toLocaleTimeString());
  const datasets = Object.entries(byLabel).map(([label, arr]) => ({
    label,
    data: arr.map(d => d.value),
    borderWidth: 2
  }));
  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, { type: 'line', data: { labels, datasets } });
}
main();
</script>
</body></html>`);
});

app.post("/dropzone/upload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files were provided for organization." });
    }

    const sessionId = nanoid(8);
    const sessionRoot = path.join(SESSIONS_DIR, sessionId);
    await fsp.mkdir(sessionRoot, { recursive: true });
    const report = await organizeUploadedFiles(sessionRoot, files);

    res.json({
      ...report,
      downloadUrl: `/dropzone/sessions/${sessionId}/download`,
      reportUrl: `/dropzone/sessions/${sessionId}/report`
    });
  } catch (err) {
    console.error("❌ Dropzone upload failed", err);
    res.status(500).json({ error: "Failed to organise uploaded files." });
  }
});

app.get("/dropzone/sessions/:sessionId/report", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const reportPath = path.join(SESSIONS_DIR, sessionId, "report.json");
    await fsp.access(reportPath);
    const payload = await fsp.readFile(reportPath, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.send(payload);
  } catch {
    res.status(404).json({ error: "Report not found." });
  }
});

app.get("/dropzone/sessions/:sessionId/download", (req, res) => {
  const { sessionId } = req.params;
  const zipPath = path.join(SESSIONS_DIR, sessionId, "structured.zip");
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: "Organised archive not found." });
  }

  res.download(zipPath, `harvestflow-structured-${sessionId}.zip`);
});

if (HAS_DASHBOARD_ASSETS) {
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }
    if (req.path.startsWith("/dropzone") || req.path.startsWith("/metrics")) {
      return next();
    }
    if (req.path.includes(".")) {
      return next();
    }
    res.sendFile(path.join(DASHBOARD_DIST, "index.html"));
  });
}

const port = process.env.PORT || 5173;

// Start the HTTP server only when executed directly (not imported by Vercel/tests).
const isMain =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Metrics UI → http://localhost:${port}`);
  });
}

export default app;
