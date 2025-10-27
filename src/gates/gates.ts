export const gates = {
  costMaxUSD(total: number, max = 0.5) {
    return total <= max;
  },
  maxSteps(steps: number, max = 25) {
    return steps <= max;
  },
  toolArgsValid(ok: boolean) {
    return ok;
  },
  finalGoalAligned(ok: boolean) {
    return ok;
  }
};
