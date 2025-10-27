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

  for (const flow of flows) {
    const msgIds = flow.nodes[0]?.msgIds ?? [];
    const msgs = chat.messages
      .filter(msg => msg.id && msgIds.includes(msg.id))
      .map(msg => ({ role: msg.role, text: msg.text ?? msg.content ?? "" }));

    flow.deliverables.push(buildDocs(flow.title, msgs));
    flow.deliverables.push(buildPrompt(flow.title, msgs));
    flow.deliverables.push(buildCode(flow.id));

    Metrics.push({ flowId: flow.id, label: "qualityScore", value: qualityScore(flow.metrics), ts: Date.now() });

    writeDeliverables(flow);
    zipFlow(flow.id);
  }

  zipMaster();
  console.log(`✅ Built ${flows.length} flows → out/flows/*.zip and out/master.zip`);
}

main().catch(err => {
  console.error("❌ Flow-Harvester failed", err);
  process.exit(1);
});
