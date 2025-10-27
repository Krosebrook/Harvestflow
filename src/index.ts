import fs from "fs";
import path from "path";
import { loadChat } from "./ingest/load.js";
import { cluster } from "./cluster/topics.js";
import { buildFlows } from "./flows/build.js";
import { writeDeliverables } from "./deliver/emit.js";
import { zipFlow, zipMaster } from "./zip/pack.js";
import { qualityScore } from "./schema/types.js";
import { Metrics } from "./metrics/store.js";

async function main() {
  const chat = loadChat("chat.json");
  const topics = await cluster(chat.messages);
  const flows = buildFlows(topics);

  const { buildDocs } = await import("./builders/docs.js");
  const { buildPrompt } = await import("./builders/prompt.js");
  const { buildCode } = await import("./builders/code.js");

  const summary: {
    flowId: string;
    title: string;
    qualityScore: number;
    metrics: (typeof flows)[number]["metrics"];
  }[] = [];

  for (const flow of flows) {
    const msgIds = flow.nodes[0]?.msgIds ?? [];
    const msgs = chat.messages
      .filter(msg => msg.id && msgIds.includes(msg.id))
      .map(msg => ({ role: msg.role, text: msg.text ?? msg.content ?? "" }));

    flow.deliverables.push(buildDocs(flow.title, msgs));
    flow.deliverables.push(buildPrompt(flow.title, msgs));
    flow.deliverables.push(buildCode(flow.id));

    Metrics.push({ flowId: flow.id, label: "qualityScore", value: qualityScore(flow.metrics), ts: Date.now() });

    const flowMetrics = {
      flowId: flow.id,
      title: flow.title,
      qualityScore: qualityScore(flow.metrics),
      metrics: flow.metrics
    };
    summary.push(flowMetrics);
    fs.mkdirSync(path.join("out", "flows", flow.id), { recursive: true });
    fs.writeFileSync(
      path.join("out", "flows", flow.id, "metrics.json"),
      JSON.stringify(flowMetrics, null, 2),
      "utf8"
    );

    writeDeliverables(flow);
    zipFlow(flow.id);
  }

  zipMaster();
  fs.mkdirSync("out", { recursive: true });
  fs.writeFileSync(path.join("out", "metrics.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(`✅ Built ${flows.length} flows → out/flows/*.zip and out/master.zip`);
}

main().catch(err => {
  console.error("❌ Flow-Harvester failed", err);
  process.exit(1);
});
