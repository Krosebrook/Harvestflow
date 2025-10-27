import { gates } from "../gates/gates.js";

export type AgentRun = {
  steps: number;
  costUSD: number;
  toolsOk: boolean;
  aligned: boolean;
};

export function evaluateAgentRun(run: AgentRun) {
  return (
    gates.costMaxUSD(run.costUSD) &&
    gates.maxSteps(run.steps) &&
    gates.toolArgsValid(run.toolsOk) &&
    gates.finalGoalAligned(run.aligned)
  );
}
