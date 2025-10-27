import { z } from "zod";

export const Message = z.object({
  id: z.string(),
  ts: z.string().optional(),
  role: z.enum(["user", "assistant", "tool", "system"]).default("user"),
  text: z.string().optional(),
  content: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional()
});
export type Message = z.infer<typeof Message>;

export const ChatExport = z.object({
  conversation_id: z.string().optional(),
  title: z.string().optional(),
  messages: z.array(Message)
});

export const FlowNode = z.object({
  id: z.string(),
  kind: z.enum(["topic", "decision", "deliverable", "evidence"]),
  label: z.string(),
  parentId: z.string().nullable(),
  msgIds: z.array(z.string()).default([])
});
export type FlowNode = z.infer<typeof FlowNode>;

export const Flow = z.object({
  id: z.string(),
  title: z.string(),
  nodes: z.array(FlowNode),
  deliverables: z.array(z.object({
    path: z.string(),
    kind: z.enum(["doc", "prompt", "code", "config", "zip"]),
    content: z.string()
  })),
  metrics: z.object({
    taskSuccessRate: z.number().min(0).max(1),
    efficiencyScore: z.number().min(0).max(1),
    automatedGateScore: z.number().min(0).max(1),
    userRating: z.number().min(0).max(1)
  })
});
export type Flow = z.infer<typeof Flow>;

export function qualityScore(m: Flow["metrics"]) {
  const weights = { user: 0.3, auto: 0.3, success: 0.25, efficiency: 0.15 };
  const score =
    weights.user * m.userRating +
    weights.auto * m.automatedGateScore +
    weights.success * m.taskSuccessRate +
    weights.efficiency * m.efficiencyScore;
  return +score.toFixed(3);
}
