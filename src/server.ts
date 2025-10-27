import express from "express";
import { Metrics } from "./metrics/store.js";

const app = express();

app.get("/metrics.json", (_req, res) => {
  res.json(Metrics.all());
});

app.get("/", (_req, res) => {
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

const port = process.env.PORT || 5173;
app.listen(port, () => {
  console.log(`Metrics UI → http://localhost:${port}`);
});
