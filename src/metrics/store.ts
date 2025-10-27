type Metric = {
  flowId: string;
  label: string;
  value: number;
  ts: number;
};

const METRICS: Metric[] = [];

export const Metrics = {
  push(metric: Metric) {
    METRICS.push(metric);
  },
  all() {
    return METRICS.slice(-1000);
  },
  byFlow(flowId: string) {
    return METRICS.filter(metric => metric.flowId === flowId);
  }
};
