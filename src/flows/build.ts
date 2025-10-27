import { Flow } from "../schema/types.js";
import { slugify } from "../utils/slugify.js";

export function buildFlows(topics: { title: string; ids: string[] }[]): Flow[] {
  return topics.map(topic => ({
    id: slugify(topic.title || "flow"),
    title: topic.title || "Flow",
    nodes: [
      {
        id: "root",
        kind: "topic",
        label: topic.title || "Flow",
        parentId: null,
        msgIds: topic.ids
      }
    ],
    deliverables: [],
    metrics: {
      taskSuccessRate: 1,
      efficiencyScore: 0.8,
      automatedGateScore: 1,
      userRating: 0.9
    }
  }));
}
