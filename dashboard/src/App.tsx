import { useEffect, useMemo, useState } from "react";

type FlowMetrics = {
  flowId: string;
  title: string;
  qualityScore: number;
  metrics: {
    taskSuccessRate: number;
    efficiencyScore: number;
    automatedGateScore: number;
    userRating: number;
  };
};

function toCSV(rows: FlowMetrics[]): string {
  const header = ["flowId", "title", "qualityScore", "taskSuccessRate", "efficiencyScore", "automatedGateScore", "userRating"];
  const lines = rows.map(row => [
    row.flowId,
    row.title.replace(/"/g, '""'),
    row.qualityScore.toString(),
    row.metrics.taskSuccessRate.toString(),
    row.metrics.efficiencyScore.toString(),
    row.metrics.automatedGateScore.toString(),
    row.metrics.userRating.toString()
  ]);
  return [header.join(","), ...lines.map(line => line.map(v => `"${v}"`).join(","))].join("\n");
}

export function App() {
  const [data, setData] = useState<FlowMetrics[]>([]);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0.9);

  useEffect(() => {
    fetch("/metrics.json")
      .then(res => res.json())
      .then((payload: FlowMetrics[]) => setData(payload))
      .catch(err => {
        console.error("Unable to load metrics", err);
      });
  }, []);

  const filtered = useMemo(() => {
    return data.filter(flow => {
      const matchesSearch = search
        ? flow.title.toLowerCase().includes(search.toLowerCase()) || flow.flowId.toLowerCase().includes(search.toLowerCase())
        : true;
      const meetsScore = flow.qualityScore >= minScore;
      return matchesSearch && meetsScore;
    });
  }, [data, search, minScore]);

  const exportCSV = () => {
    const blob = new Blob([toCSV(filtered)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "harvestflow-metrics.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ fontFamily: "system-ui", margin: "2rem" }}>
      <header style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>HarvestFlow Metrics</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            placeholder="Search flows"
            value={search}
            onChange={event => setSearch(event.target.value)}
            style={{ padding: "0.5rem", minWidth: "16rem" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Min qualityScore
            <input
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={minScore}
              onChange={event => setMinScore(Number(event.target.value) || 0)}
              style={{ width: "5rem", padding: "0.5rem" }}
            />
          </label>
          <button onClick={exportCSV} style={{ padding: "0.6rem 1rem" }}>
            Export CSV
          </button>
        </div>
      </header>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Flow", "Title", "qualityScore", "Success", "Efficiency", "Automated", "User"].map(label => (
              <th key={label} style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccc" }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(flow => (
            <tr key={flow.flowId}>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{flow.flowId}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{flow.title}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{flow.qualityScore.toFixed(3)}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{flow.metrics.taskSuccessRate.toFixed(2)}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{flow.metrics.efficiencyScore.toFixed(2)}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{flow.metrics.automatedGateScore.toFixed(2)}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{flow.metrics.userRating.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && <p style={{ marginTop: "1.5rem" }}>No flows match the current filters.</p>}
    </main>
  );
}

export default App;
