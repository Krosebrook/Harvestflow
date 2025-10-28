import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import { createHash } from "crypto";
import AdmZip from "adm-zip";
import { categorizeFile, CategoryDefinition } from "./taxonomy.js";

type UploadedFile = Express.Multer.File;

type FileReport = {
  originalName: string;
  sanitizedName: string;
  size: number;
  hash: string;
  category: CategoryDefinition;
  rawPath: string;
  structuredPath: string;
};

export type CategorySummary = {
  categoryId: CategoryDefinition["id"];
  label: string;
  suggestedPath: string;
  rationale: string;
  count: number;
  bytes: number;
  sampleFiles: string[];
};

export type DuplicateSummary = {
  hash: string;
  size: number;
  files: string[];
};

export type SessionReport = {
  sessionId: string;
  createdAt: string;
  totalFiles: number;
  totalBytes: number;
  categories: CategorySummary[];
  duplicates: DuplicateSummary[];
  warnings: string[];
  downloadRelativePath: string;
  structuredRoot: string;
  rawRoot: string;
  files: Array<{
    originalName: string;
    sanitizedName: string;
    categoryId: CategoryDefinition["id"];
    categoryLabel: string;
    suggestedPath: string;
    rawPath: string;
    structuredPath: string;
    size: number;
    hash: string;
  }>;
};

export async function organizeUploadedFiles(sessionRoot: string, files: UploadedFile[]): Promise<SessionReport> {
  if (!files.length) {
    throw new Error("No files provided for organization");
  }

  const rawRoot = path.join(sessionRoot, "raw");
  const structuredRoot = path.join(sessionRoot, "structured");
  await fsp.mkdir(rawRoot, { recursive: true });
  await fsp.mkdir(structuredRoot, { recursive: true });

  const fileReports: FileReport[] = [];
  const warnings = new Set<string>();

  for (const file of files) {
    const originalName = file.originalname || "unnamed";
    const sanitizedName = sanitizeFilename(originalName);
    const rawFilename = await uniqueFilename(rawRoot, sanitizedName);
    const rawPath = path.join(rawRoot, rawFilename);

    await fsp.rename(file.path, rawPath);

    const stats = await fsp.stat(rawPath);
    const hash = await hashFile(rawPath);
    const category = categorizeFile(sanitizedName);
    const structuredDir = path.join(structuredRoot, category.suggestedPath);
    await fsp.mkdir(structuredDir, { recursive: true });

    const structuredFilename = await uniqueFilename(structuredDir, sanitizedName);
    const structuredPath = path.join(structuredDir, structuredFilename);
    await fsp.copyFile(rawPath, structuredPath);

    if (category.id === "unknown") {
      warnings.add(`Manual review required: "${sanitizedName}" could not be auto-classified.`);
    }
    if (category.id === "archives") {
      warnings.add(`Archive detected: extract "${sanitizedName}" to inspect its contents before use.`);
    }

    fileReports.push({
      originalName,
      sanitizedName,
      size: stats.size,
      hash,
      category,
      rawPath,
      structuredPath
    });
  }

  const duplicates = detectDuplicates(fileReports, warnings);
  const categories = summarizeCategories(fileReports);
  const sessionId = path.basename(sessionRoot);

  const zipPathRelative = "structured.zip";
  const zipPath = path.join(sessionRoot, zipPathRelative);
  const zip = new AdmZip();
  zip.addLocalFolder(structuredRoot);
  zip.writeZip(zipPath);

  const report: SessionReport = {
    sessionId,
    createdAt: new Date().toISOString(),
    totalFiles: fileReports.length,
    totalBytes: fileReports.reduce((sum, file) => sum + file.size, 0),
    categories,
    duplicates,
    warnings: Array.from(warnings),
    downloadRelativePath: zipPathRelative,
    structuredRoot: path.relative(process.cwd(), structuredRoot),
    rawRoot: path.relative(process.cwd(), rawRoot),
    files: fileReports.map(file => ({
      originalName: file.originalName,
      sanitizedName: file.sanitizedName,
      categoryId: file.category.id,
      categoryLabel: file.category.label,
      suggestedPath: file.category.suggestedPath,
      rawPath: path.relative(sessionRoot, file.rawPath),
      structuredPath: path.relative(sessionRoot, file.structuredPath),
      size: file.size,
      hash: file.hash
    }))
  };

  await fsp.writeFile(path.join(sessionRoot, "report.json"), JSON.stringify(report, null, 2), "utf8");

  return report;
}

async function uniqueFilename(dir: string, candidate: string): Promise<string> {
  const sanitized = candidate || "file";
  let attempt = 0;
  const ext = path.extname(sanitized);
  const base = path.basename(sanitized, ext);

  while (true) {
    const name = attempt === 0 ? sanitized : `${base}-${attempt}${ext}`;
    const fullPath = path.join(dir, name);
    try {
      await fsp.access(fullPath);
      attempt += 1;
    } catch {
      return name;
    }
  }
}

function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/[/\\?%*:|"<>]/g, "_");
  return trimmed || "file";
}

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function detectDuplicates(fileReports: FileReport[], warnings: Set<string>): DuplicateSummary[] {
  const map = new Map<string, FileReport[]>();
  for (const file of fileReports) {
    const bucket = map.get(file.hash) ?? [];
    bucket.push(file);
    map.set(file.hash, bucket);
  }

  const duplicates: DuplicateSummary[] = [];
  for (const [hash, files] of map.entries()) {
    if (files.length > 1) {
      duplicates.push({
        hash,
        size: files[0].size,
        files: files.map(file => file.sanitizedName)
      });
      warnings.add(`Potential duplicate group detected: ${files.map(file => `"${file.sanitizedName}"`).join(", ")}`);
    }
  }
  return duplicates;
}

function summarizeCategories(fileReports: FileReport[]): CategorySummary[] {
  const summaries = new Map<CategoryDefinition["id"], CategorySummary>();

  for (const file of fileReports) {
    const entry = summaries.get(file.category.id);
    if (!entry) {
      summaries.set(file.category.id, {
        categoryId: file.category.id,
        label: file.category.label,
        suggestedPath: file.category.suggestedPath,
        rationale: file.category.rationale,
        count: 1,
        bytes: file.size,
        sampleFiles: [file.sanitizedName]
      });
    } else {
      entry.count += 1;
      entry.bytes += file.size;
      if (entry.sampleFiles.length < 5) {
        entry.sampleFiles.push(file.sanitizedName);
      }
    }
  }

  return Array.from(summaries.values()).sort((a, b) => b.bytes - a.bytes);
}
