import path from "path";

export type CategoryId =
  | "images"
  | "documents"
  | "presentations"
  | "spreadsheets"
  | "data"
  | "archives"
  | "code"
  | "design"
  | "audio"
  | "video"
  | "notes"
  | "unknown";

export type CategoryDefinition = {
  id: CategoryId;
  label: string;
  extensions: string[];
  suggestedPath: string;
  rationale: string;
};

const CATEGORY_RULES: CategoryDefinition[] = [
  {
    id: "images",
    label: "Visual Assets",
    extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "tiff", "heic", "ico"],
    suggestedPath: path.join("Assets", "Images"),
    rationale: "Keep raw imagery grouped for quick reuse across flow deliverables."
  },
  {
    id: "documents",
    label: "Reference Documents",
    extensions: ["pdf", "doc", "docx", "txt", "md", "rtf", "odt"],
    suggestedPath: path.join("Docs", "References"),
    rationale: "Surface supporting documents that inform flow guidance."
  },
  {
    id: "presentations",
    label: "Presentation Decks",
    extensions: ["ppt", "pptx", "key", "odp"],
    suggestedPath: path.join("Docs", "Presentations"),
    rationale: "Store stakeholder decks together for easy review."
  },
  {
    id: "spreadsheets",
    label: "Spreadsheets",
    extensions: ["xls", "xlsx", "csv", "ods", "tsv"],
    suggestedPath: path.join("Data", "Spreadsheets"),
    rationale: "Collect tabular sources that feed metrics or prompts."
  },
  {
    id: "data",
    label: "Structured Data",
    extensions: ["json", "jsonl", "yaml", "yml", "xml", "ndjson", "parquet"],
    suggestedPath: path.join("Data", "Raw"),
    rationale: "Keep machine-readable assets ready for ingestion pipelines."
  },
  {
    id: "archives",
    label: "Archives",
    extensions: ["zip", "tar", "gz", "tgz", "bz2", "7z", "rar", "tar.gz", "tar.bz2", "tar.xz"],
    suggestedPath: path.join("Ingest", "Archives"),
    rationale: "Quarantine archives before extracting into curated directories."
  },
  {
    id: "code",
    label: "Source Code",
    extensions: [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "rb",
      "java",
      "go",
      "c",
      "cpp",
      "cs",
      "sh",
      "sql",
      "html",
      "css",
      "scss",
      "jsonc",
      "rs",
      "php",
      "kt",
      "swift"
    ],
    suggestedPath: path.join("Code", "Snippets"),
    rationale: "Group reusable snippets and automation scripts."
  },
  {
    id: "design",
    label: "Design Files",
    extensions: ["fig", "sketch", "xd", "ai", "psd"],
    suggestedPath: path.join("Assets", "Design"),
    rationale: "Keep high-fidelity design artefacts consolidated."
  },
  {
    id: "audio",
    label: "Audio Assets",
    extensions: ["mp3", "wav", "m4a", "ogg", "flac", "aac"],
    suggestedPath: path.join("Assets", "Audio"),
    rationale: "Store voice-over or sound design material together."
  },
  {
    id: "video",
    label: "Video Clips",
    extensions: ["mp4", "mov", "avi", "mkv", "webm"],
    suggestedPath: path.join("Assets", "Video"),
    rationale: "Collect reference or produced motion assets."
  },
  {
    id: "notes",
    label: "Notes & Logs",
    extensions: ["note", "log"],
    suggestedPath: path.join("Docs", "Notes"),
    rationale: "Capture scratch notes for follow-up or triage."
  },
  {
    id: "unknown",
    label: "Unclassified",
    extensions: [],
    suggestedPath: path.join("ToReview", "Misc"),
    rationale: "Flag files that require a manual decision."
  }
];

const extensionLookup = new Map<string, CategoryDefinition>();
for (const def of CATEGORY_RULES) {
  for (const ext of def.extensions) {
    extensionLookup.set(ext.toLowerCase(), def);
  }
}

const archiveMultiExtensions = ["tar.gz", "tar.bz2", "tar.xz"];
const archiveDefinition = CATEGORY_RULES.find(def => def.id === "archives")!;

export function categorizeFile(filename: string): CategoryDefinition {
  const lower = filename.toLowerCase();
  for (const multi of archiveMultiExtensions) {
    if (lower.endsWith(`.${multi}`)) {
      return archiveDefinition;
    }
  }

  const ext = path.extname(lower).replace(/^\./, "");
  if (!ext) {
    return CATEGORY_RULES.find(def => def.id === "unknown")!;
  }

  return extensionLookup.get(ext) ?? CATEGORY_RULES.find(def => def.id === "unknown")!;
}

export function getCategories(): CategoryDefinition[] {
  return CATEGORY_RULES;
}
