import fs from "fs";
import path from "path";
import { z } from "zod";
import levenshtein from "fast-levenshtein";

const Message = z.object({
  role: z.enum(["user", "assistant", "system"]).optional(),
  text: z.string().optional(),
  content: z.string().optional()
});
const ChatExport = z.object({
  conversation_id: z.string().optional(),
  title: z.string().optional(),
  messages: z.array(Message)
});

// --- util --------------------------------------------------------
function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function chunkText(text: string, size = 1200) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size)
    chunks.push(text.slice(i, i + size));
  return chunks;
}
function auditPair(a: string, b: string) {
  const lev = levenshtein.get(a, b);
  const pct = ((lev / Math.max(a.length, 1)) * 100).toFixed(2);
  return { lev, pct };
}
// ----------------------------------------------------------------

const root = process.cwd();
const chatsDir = path.join(root, "chats");
const outDir = path.join(root, "out");
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(chatsDir).filter(f => f.endsWith(".json"));
if (!files.length) {
  console.error("No chat JSON files found in ./chats/");
  process.exit(1);
}

const indexLines: string[] = [];
for (const file of files) {
  const raw = fs.readFileSync(path.join(chatsDir, file), "utf8");
  const json = ChatExport.parse(JSON.parse(raw));
  const title = json.title || path.basename(file, ".json");
  const slug = safe(title);
  const mdDir = path.join(outDir, slug);
  fs.mkdirSync(mdDir, { recursive: true });

  // Build transcript markdown
  const md = json.messages
    .map(
      (m, i) =>
        `### ${i + 1}. ${m.role?.toUpperCase() || "UNK"}\n\n${m.text || m.content || ""}\n`
    )
    .join("\n---\n");

  // Chunk long files
  const chunks = chunkText(md, 10000);
  chunks.forEach((chunk, i) => {
    const f = path.join(mdDir, `${slug}-part${i + 1}.md`);
    fs.writeFileSync(f, chunk, "utf8");
  });

  // Simple audit summary
  const userMsgs = json.messages.filter(m => m.role === "user").map(m => m.text || "");
  const aiMsgs = json.messages.filter(m => m.role === "assistant").map(m => m.text || "");
  const audits = [];
  for (let i = 0; i < Math.min(userMsgs.length, aiMsgs.length); i++) {
    const { pct } = auditPair(userMsgs[i], aiMsgs[i]);
    audits.push({ pair: i + 1, driftPct: pct });
  }
  const avgDrift =
    audits.reduce((a, b) => a + parseFloat(b.driftPct), 0) /
    Math.max(audits.length, 1);

  const summary = `# ${title}\n- Messages: ${json.messages.length}\n- Avg user/assistant drift: ${avgDrift.toFixed(
    2
  )}%\n- Parts: ${chunks.length}\n`;
  fs.writeFileSync(path.join(mdDir, "summary.md"), summary, "utf8");

  indexLines.push(`- [${title}](./${slug}/summary.md)`);
}

fs.writeFileSync(path.join(outDir, "INDEX.md"), "# Chat Deliverables\n\n" + indexLines.join("\n"));
console.log(`✅ Generated deliverables for ${files.length} chat(s) → ${outDir}`);
