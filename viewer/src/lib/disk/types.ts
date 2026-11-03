export type SizeMode = "logical" | "allocated";

export type ScanFolder = {
  name: string;
  path: string;
  logicalBytes: number;
  allocatedBytes: number;
  fileCount: number;
  folderCount: number;
  children: ScanFolder[];
};

export type ScanFile = {
  path: string;
  name: string;
  extension: string;
  logicalBytes: number;
  allocatedBytes: number;
  modifiedUtc: string;
};

export type ExtensionStat = {
  extension: string;
  fileCount: number;
  logicalBytes: number;
  allocatedBytes: number;
};

export type AgeStat = {
  bucket: string;
  fileCount: number;
  logicalBytes: number;
  allocatedBytes: number;
};

export type DuplicateGroup = {
  match: "sha256" | "size";
  hash?: string;
  logicalBytes: number;
  count: number;
  wasteBytes: number;
  paths: string[];
};

export type ScanError = {
  path: string;
  message: string;
};

export type ScanSummary = {
  logicalBytes: number;
  allocatedBytes: number;
  fileCount: number;
  folderCount: number;
  deniedCount: number;
  reparseSkipped: number;
  duplicateGroups: number;
  duplicateWasteBytes: number;
  allocatedCollected: boolean;
};

export type ScanReport = {
  kind: "scan";
  tool: string;
  version: string;
  scannedAt: string;
  host: string;
  root: string;
  elapsedMs: number;
  summary: ScanSummary;
  tree: ScanFolder;
  largestFolders: Array<{
    path: string;
    name: string;
    logicalBytes: number;
    allocatedBytes: number;
    fileCount: number;
    depth: number;
  }>;
  largestFiles: ScanFile[];
  extensions: ExtensionStat[];
  ages: AgeStat[];
  duplicates: DuplicateGroup[];
  errors: ScanError[];
};

export type ChangeRow = {
  path: string;
  name: string;
  beforeBytes: number;
  afterBytes: number;
  deltaBytes: number;
};

export type CompareReport = {
  kind: "compare";
  tool: string;
  version: string;
  generatedAt: string;
  before: { label: string; scannedAt?: string; logicalBytes: number };
  after: { label: string; scannedAt?: string; logicalBytes: number };
  grew: ChangeRow[];
  shrunk: ChangeRow[];
  added: ChangeRow[];
  removed: ChangeRow[];
};

export type LoadedReport =
  | { mode: "scan"; report: ScanReport }
  | { mode: "compare"; report: CompareReport };
