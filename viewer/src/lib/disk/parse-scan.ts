import type {
  AgeStat,
  ChangeRow,
  CompareReport,
  DuplicateGroup,
  ExtensionStat,
  LoadedReport,
  ScanError,
  ScanFile,
  ScanFolder,
  ScanReport,
} from "@/lib/disk/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseFolder(value: unknown): ScanFolder | null {
  const row = asRecord(value);
  if (!row) return null;
  const name = str(row.name);
  const path = str(row.path);
  if (!name && !path) return null;
  const children = list(row.children)
    .map(parseFolder)
    .filter((child): child is ScanFolder => child !== null);
  return {
    name: name || path,
    path: path || name,
    logicalBytes: num(row.logicalBytes),
    allocatedBytes: num(row.allocatedBytes),
    fileCount: num(row.fileCount),
    folderCount: num(row.folderCount),
    children,
  };
}

function parseScan(row: Record<string, unknown>): ScanReport | null {
  const tree = parseFolder(row.tree);
  const summary = asRecord(row.summary);
  if (!tree || !summary) return null;
  return {
    kind: "scan",
    tool: str(row.tool, "SizeTree"),
    version: str(row.version, "1.0"),
    scannedAt: str(row.scannedAt),
    host: str(row.host, "unknown"),
    root: str(row.root, tree.path),
    elapsedMs: num(row.elapsedMs),
    summary: {
      logicalBytes: num(summary.logicalBytes, tree.logicalBytes),
      allocatedBytes: num(summary.allocatedBytes, tree.allocatedBytes),
      fileCount: num(summary.fileCount, tree.fileCount),
      folderCount: num(summary.folderCount, tree.folderCount),
      deniedCount: num(summary.deniedCount),
      reparseSkipped: num(summary.reparseSkipped),
      duplicateGroups: num(summary.duplicateGroups),
      duplicateWasteBytes: num(summary.duplicateWasteBytes),
      allocatedCollected: summary.allocatedCollected === true,
    },
    tree,
    largestFolders: list(row.largestFolders).map((item) => {
      const folder = asRecord(item);
      return {
        path: str(folder?.path),
        name: str(folder?.name),
        logicalBytes: num(folder?.logicalBytes),
        allocatedBytes: num(folder?.allocatedBytes),
        fileCount: num(folder?.fileCount),
        depth: num(folder?.depth),
      };
    }),
    largestFiles: list(row.largestFiles).map(parseFile).filter((file): file is ScanFile => file !== null),
    extensions: list(row.extensions).map(parseExtension).filter((row): row is ExtensionStat => row !== null),
    ages: list(row.ages).map(parseAge).filter((row): row is AgeStat => row !== null),
    duplicates: list(row.duplicates).map(parseDuplicate).filter((row): row is DuplicateGroup => row !== null),
    errors: list(row.errors).map(parseError).filter((row): row is ScanError => row !== null),
  };
}

function parseFile(value: unknown): ScanFile | null {
  const row = asRecord(value);
  if (!row) return null;
  const path = str(row.path);
  const name = str(row.name);
  if (!path && !name) return null;
  return {
    path: path || name,
    name: name || path,
    extension: str(row.extension, "(none)"),
    logicalBytes: num(row.logicalBytes),
    allocatedBytes: num(row.allocatedBytes),
    modifiedUtc: str(row.modifiedUtc),
  };
}

function parseExtension(value: unknown): ExtensionStat | null {
  const row = asRecord(value);
  if (!row) return null;
  const extension = str(row.extension);
  if (!extension) return null;
  return {
    extension,
    fileCount: num(row.fileCount),
    logicalBytes: num(row.logicalBytes),
    allocatedBytes: num(row.allocatedBytes),
  };
}

function parseAge(value: unknown): AgeStat | null {
  const row = asRecord(value);
  if (!row) return null;
  const bucket = str(row.bucket);
  if (!bucket) return null;
  return {
    bucket,
    fileCount: num(row.fileCount),
    logicalBytes: num(row.logicalBytes),
    allocatedBytes: num(row.allocatedBytes),
  };
}

function parseDuplicate(value: unknown): DuplicateGroup | null {
  const row = asRecord(value);
  if (!row) return null;
  const paths = list(row.paths).filter((item): item is string => typeof item === "string");
  if (paths.length === 0) return null;
  const match = row.match === "sha256" ? "sha256" : "size";
  return {
    match,
    hash: typeof row.hash === "string" ? row.hash : undefined,
    logicalBytes: num(row.logicalBytes),
    count: num(row.count, paths.length),
    wasteBytes: num(row.wasteBytes),
    paths,
  };
}

function parseError(value: unknown): ScanError | null {
  const row = asRecord(value);
  if (!row) return null;
  const path = str(row.path);
  const message = str(row.message);
  if (!path && !message) return null;
  return { path, message };
}

function parseChange(value: unknown): ChangeRow | null {
  const row = asRecord(value);
  if (!row) return null;
  const path = str(row.path);
  if (!path) return null;
  return {
    path,
    name: str(row.name, path),
    beforeBytes: num(row.beforeBytes),
    afterBytes: num(row.afterBytes),
    deltaBytes: num(row.deltaBytes, num(row.afterBytes) - num(row.beforeBytes)),
  };
}

function parseCompare(row: Record<string, unknown>): CompareReport | null {
  const before = asRecord(row.before);
  const after = asRecord(row.after);
  if (!before || !after) return null;
  return {
    kind: "compare",
    tool: str(row.tool, "SizeTree.Compare"),
    version: str(row.version, "1.0"),
    generatedAt: str(row.generatedAt),
    before: {
      label: str(before.label, "Before"),
      scannedAt: typeof before.scannedAt === "string" ? before.scannedAt : undefined,
      logicalBytes: num(before.logicalBytes),
    },
    after: {
      label: str(after.label, "After"),
      scannedAt: typeof after.scannedAt === "string" ? after.scannedAt : undefined,
      logicalBytes: num(after.logicalBytes),
    },
    grew: list(row.grew).map(parseChange).filter((item): item is ChangeRow => item !== null),
    shrunk: list(row.shrunk).map(parseChange).filter((item): item is ChangeRow => item !== null),
    added: list(row.added).map(parseChange).filter((item): item is ChangeRow => item !== null),
    removed: list(row.removed).map(parseChange).filter((item): item is ChangeRow => item !== null),
  };
}

export function parseReportJson(text: string): LoadedReport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const row = asRecord(raw);
  if (!row) throw new Error("The report must be a JSON object.");
  if (row.kind === "compare") {
    const report = parseCompare(row);
    if (!report) throw new Error("Compare report is missing before/after sections.");
    return { mode: "compare", report };
  }
  const report = parseScan(row);
  if (!report) throw new Error("Scan report is missing the folder tree or summary. Export JSON from SizeTree.");
  return { mode: "scan", report };
}
