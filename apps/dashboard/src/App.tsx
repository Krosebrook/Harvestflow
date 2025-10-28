import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";

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

type OrganizeReport = {
  sessionId: string;
  createdAt: string;
  totalFiles: number;
  totalBytes: number;
  categories: Array<{
    categoryId: string;
    label: string;
    suggestedPath: string;
    rationale: string;
    count: number;
    bytes: number;
    sampleFiles: string[];
  }>;
  duplicates: Array<{
    hash: string;
    size: number;
    files: string[];
  }>;
  warnings: string[];
  downloadRelativePath: string;
  structuredRoot: string;
  rawRoot: string;
  files: Array<{
    originalName: string;
    sanitizedName: string;
    categoryId: string;
    categoryLabel: string;
    suggestedPath: string;
    rawPath: string;
    structuredPath: string;
    size: number;
    hash: string;
  }>;
  downloadUrl: string;
  reportUrl: string;
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`;
}

export function App() {
  const [data, setData] = useState<FlowMetrics[]>([]);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0.9);
  const [dropActive, setDropActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organizeReport, setOrganizeReport] = useState<OrganizeReport | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;

    setUploading(true);
    setUploadError(null);
    setLastUploaded(files.map(file => file.name));

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file, file.name);
    });

    try {
      const response = await fetch("/dropzone/upload", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed");
      }
      const payload: OrganizeReport = await response.json();
      setOrganizeReport(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
      setOrganizeReport(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    uploadFiles(files);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropActive(false);
    const droppedFiles = Array.from(event.dataTransfer?.files ?? []);
    if (!droppedFiles.length) {
      setUploadError("No files detected. Try zipping folders before dropping.");
      return;
    }
    await uploadFiles(droppedFiles);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropActive(true);
  };

  const handleDragLeave = () => {
    setDropActive(false);
  };

  const downloadOrganized = () => {
    if (organizeReport) {
      window.open(organizeReport.downloadUrl, "_blank", "noopener");
    }
  };

  const refetchReport = async () => {
    if (!organizeReport) return;
    try {
      const response = await fetch(organizeReport.reportUrl);
      if (!response.ok) return;
      const payload = (await response.json()) as Partial<OrganizeReport>;
      setOrganizeReport(prev =>
        prev
          ? {
              ...prev,
              ...payload,
              downloadUrl: prev.downloadUrl,
              reportUrl: prev.reportUrl
            }
          : payload
      );
    } catch {
      /* no-op */
    }
  };

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

      <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #ccc", borderRadius: "0.75rem", background: "#fdfdfd" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Dropzone Auto-Organizer</h2>
          <button onClick={openFilePicker} style={{ padding: "0.5rem 0.9rem" }}>
            Choose files
          </button>
        </div>
        <p style={{ marginTop: 0, marginBottom: "1rem", color: "#444" }}>
          Drag and drop files, images, docs, zips, or zipped folders here. We&apos;ll classify, audit, and propose an organised structure automatically.
        </p>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragLeave}
          onClick={openFilePicker}
          style={{
            border: "2px dashed #9aa7c2",
            borderRadius: "0.75rem",
            background: dropActive ? "#eef5ff" : "#f6f8fb",
            padding: "2.5rem",
            textAlign: "center",
            cursor: "pointer",
            transition: "background 0.2s ease"
          }}
        >
          <strong>{dropActive ? "Release to organise" : "Drop files or click to browse"}</strong>
          <p style={{ marginTop: "0.5rem", color: "#61708c" }}>
            Tip: For directories, zip them first so the organiser can inspect contents.
          </p>
          {uploading && <p style={{ marginTop: "0.75rem" }}>Uploading and analysing…</p>}
        </div>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
        {lastUploaded.length > 0 && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#555" }}>
            Last upload: {lastUploaded.slice(0, 3).join(", ")}
            {lastUploaded.length > 3 ? `, +${lastUploaded.length - 3} more` : ""}
          </p>
        )}
        {uploadError && (
          <p style={{ marginTop: "0.75rem", color: "#c0272d" }}>
            {uploadError}
          </p>
        )}
        {organizeReport && (
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e1e4ea", paddingTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>Organised {organizeReport.totalFiles} items ({formatBytes(organizeReport.totalBytes)})</h3>
              <button onClick={downloadOrganized} style={{ padding: "0.45rem 0.8rem" }}>
                Download organised bundle
              </button>
              <button onClick={refetchReport} style={{ padding: "0.45rem 0.8rem" }}>
                Refresh report
              </button>
              <span style={{ fontSize: "0.85rem", color: "#61708c" }}>Session {organizeReport.sessionId}</span>
            </div>
            <p style={{ margin: "0.75rem 0", color: "#4a566b" }}>
              Created {new Date(organizeReport.createdAt).toLocaleString()}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
              <thead>
                <tr>
                  {["Category", "Suggested path", "Files", "Size", "Rationale"].map(label => (
                    <th key={label} style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #ccd5e0" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizeReport.categories.map(category => (
                  <tr key={category.categoryId}>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #edf1f7" }}>{category.label}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #edf1f7" }}>{category.suggestedPath}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #edf1f7" }}>{category.count}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #edf1f7" }}>{formatBytes(category.bytes)}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #edf1f7", color: "#61708c" }}>{category.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {organizeReport.duplicates.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Duplicate alerts:</strong>
                <ul>
                  {organizeReport.duplicates.map(duplicate => (
                    <li key={duplicate.hash} style={{ color: "#8c3d00" }}>
                      {duplicate.files.join(", ")} ({formatBytes(duplicate.size)})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {organizeReport.warnings.length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <strong>Warnings:</strong>
                <ul>
                  {organizeReport.warnings.map((warning, index) => (
                    <li key={index} style={{ color: "#b34747" }}>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

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
