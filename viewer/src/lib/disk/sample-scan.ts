import type { CompareReport, ScanFile, ScanFolder, ScanReport } from "@/lib/disk/types";

const GB = 1024 ** 3;
const MB = 1024 ** 2;
const SCANNED_AT = "2026-11-03T01:06:00Z";

type FileDraft = {
  name: string;
  logical: number;
  ageDays: number;
  allocated?: number;
};

type BulkDraft = {
  ext: string;
  count: number;
  totalBytes: number;
  ageDays: number;
  allocatedRatio?: number;
};

type Draft = {
  name: string;
  files?: FileDraft[];
  bulk?: BulkDraft[];
  children?: Draft[];
};

const volume: Draft = {
  name: "D:\\",
  children: [
    {
      name: "SQL",
      children: [
        {
          name: "DATA",
          files: [
            { name: "AppDB.mdf", logical: 280 * GB, ageDays: 1 },
            { name: "AppDB_data2.ndf", logical: 164 * GB, ageDays: 1 },
            { name: "Audit.mdf", logical: 72 * GB, ageDays: 40 },
            { name: "Reporting.mdf", logical: 38 * GB, ageDays: 18 },
          ],
        },
        {
          name: "LOG",
          files: [
            { name: "AppDB_log.ldf", logical: 48 * GB, ageDays: 0 },
            { name: "Audit_log.ldf", logical: 9 * GB, ageDays: 2 },
          ],
        },
        {
          name: "Backup",
          children: [
            {
              name: "FULL",
              files: [
                { name: "AppDB_full_20261102.bak", logical: 96 * GB, ageDays: 1 },
                { name: "AppDB_full_20261026.bak", logical: 94 * GB, ageDays: 8 },
                { name: "AppDB_full_20261102_copy.bak", logical: 96 * GB, ageDays: 1 },
              ],
            },
            {
              name: "DIFF",
              files: [
                { name: "AppDB_diff_20261102.bak", logical: 14 * GB, ageDays: 1 },
                { name: "AppDB_diff_20261101.bak", logical: 11 * GB, ageDays: 2 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Elastic",
      children: [
        {
          name: "nodes",
          children: [
            {
              name: "0",
              children: [
                {
                  name: "indices",
                  children: [
                    {
                      name: "logs-2026.10",
                      files: [
                        { name: "shard-0.cfs", logical: 92 * GB, ageDays: 3 },
                        { name: "shard-1.cfs", logical: 88 * GB, ageDays: 3 },
                      ],
                      bulk: [{ ext: ".cfs", count: 6400, totalBytes: 18 * GB, ageDays: 6 }],
                    },
                    {
                      name: "metrics-2026.10",
                      files: [{ name: "shard-0.cfs", logical: 74 * GB, ageDays: 4 }],
                      bulk: [{ ext: ".cfs", count: 4100, totalBytes: 22 * GB, ageDays: 9 }],
                    },
                    {
                      name: "traces-apm",
                      files: [{ name: "shard-0.cfs", logical: 41 * GB, ageDays: 2 }],
                      bulk: [{ ext: ".si", count: 2200, totalBytes: 1.2 * GB, ageDays: 2 }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Kafka",
      children: [
        {
          name: "logs",
          files: [
            { name: "app-events-0.log", logical: 46 * GB, ageDays: 0 },
            { name: "app-events-1.log", logical: 44 * GB, ageDays: 0 },
            { name: "audit-0.log", logical: 38 * GB, ageDays: 1 },
            { name: "connect-offsets.log", logical: 22 * GB, ageDays: 1 },
            { name: "payments-0.log", logical: 19 * GB, ageDays: 0 },
          ],
          bulk: [{ ext: ".index", count: 860, totalBytes: 2.4 * GB, ageDays: 1 }],
        },
      ],
    },
    {
      name: "IIS",
      children: [
        {
          name: "logs",
          children: [
            {
              name: "W3SVC1",
              bulk: [{ ext: ".log", count: 6200, totalBytes: 38 * GB, ageDays: 4 }],
              files: [{ name: "u_ex261103.log", logical: 1.8 * GB, ageDays: 0 }],
            },
            {
              name: "W3SVC2",
              bulk: [{ ext: ".log", count: 2400, totalBytes: 14 * GB, ageDays: 6 }],
            },
          ],
        },
        {
          name: "wwwroot",
          bulk: [
            { ext: ".dll", count: 1800, totalBytes: 640 * MB, ageDays: 40 },
            { ext: ".json", count: 420, totalBytes: 80 * MB, ageDays: 12 },
          ],
          files: [{ name: "web.config", logical: 18 * 1024, ageDays: 80 }],
        },
      ],
    },
    {
      name: "Shares",
      children: [
        {
          name: "Engineering",
          children: [
            {
              name: "VM",
              files: [
                {
                  name: "build-agent.vhdx",
                  logical: 120 * GB,
                  allocated: 48 * GB,
                  ageDays: 21,
                },
              ],
            },
            {
              name: "Installers",
              files: [{ name: "vs_enterprise.iso", logical: 8.2 * GB, ageDays: 120 }],
            },
          ],
        },
        {
          name: "Finance",
          children: [
            {
              name: "Archive",
              files: [
                { name: "FY2024.zip", logical: 24 * GB, ageDays: 400 },
                { name: "FY2023.zip", logical: 18 * GB, ageDays: 780 },
                { name: "FY2022.zip", logical: 15 * GB, ageDays: 1200 },
              ],
            },
          ],
        },
        {
          name: "Software",
          children: [
            {
              name: "ISO",
              files: [
                { name: "vs_enterprise.iso", logical: 8.2 * GB, ageDays: 120 },
                { name: "sql2022.iso", logical: 1.6 * GB, ageDays: 300 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "SCCM",
      children: [
        {
          name: "ContentLib",
          bulk: [
            { ext: ".sft", count: 3200, totalBytes: 28 * GB, ageDays: 30 },
            { ext: ".cab", count: 640, totalBytes: 6 * GB, ageDays: 45 },
          ],
        },
        {
          name: "CI",
          bulk: [{ ext: ".xml", count: 14000, totalBytes: 2.1 * GB, ageDays: 10 }],
        },
      ],
    },
    {
      name: "Users",
      children: [
        {
          name: "Profiles",
          children: [
            {
              name: "svc-sql",
              bulk: [{ ext: ".mdf", count: 4, totalBytes: 12 * GB, ageDays: 15 }],
              files: [{ name: "errorlog.txt", logical: 420 * MB, ageDays: 1 }],
            },
            {
              name: "svc-iis",
              bulk: [{ ext: ".evtx", count: 80, totalBytes: 6.4 * GB, ageDays: 8 }],
            },
            {
              name: "admin",
              bulk: [{ ext: ".pst", count: 3, totalBytes: 9.5 * GB, ageDays: 20 }],
            },
          ],
        },
      ],
    },
    {
      name: "Temp",
      children: [
        {
          name: "Extract",
          bulk: [{ ext: ".tmp", count: 19000, totalBytes: 11 * GB, ageDays: 3 }],
          files: [{ name: "dotnet-sdk-copy.iso", logical: 220 * MB, ageDays: 60 }],
        },
        {
          name: "OldAgent",
          files: [{ name: "winpe.wim", logical: 4.6 * GB, ageDays: 500 }],
        },
      ],
    },
  ],
};

type Built = {
  files: ScanFile[];
  folders: ScanReport["largestFolders"];
  extensions: Map<string, { fileCount: number; logicalBytes: number; allocatedBytes: number }>;
  ages: Map<string, { fileCount: number; logicalBytes: number; allocatedBytes: number }>;
};

function ageBucket(days: number): string {
  if (days <= 7) return "0–7 days";
  if (days <= 30) return "8–30 days";
  if (days <= 90) return "31–90 days";
  if (days <= 365) return "91–365 days";
  if (days <= 365 * 3) return "1–3 years";
  return "Older than 3 years";
}

const AGE_ORDER = [
  "0–7 days",
  "8–30 days",
  "31–90 days",
  "91–365 days",
  "1–3 years",
  "Older than 3 years",
];

function modifiedFromAge(days: number): string {
  const ms = Date.parse(SCANNED_AT) - days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

function extOf(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return "(none)";
  return name.slice(idx).toLowerCase();
}

function emptyBuiltMaps(): Built {
  return { files: [], folders: [], extensions: new Map(), ages: new Map() };
}

function addExt(
  map: Built["extensions"],
  ext: string,
  count: number,
  logical: number,
  allocated: number,
) {
  const cur = map.get(ext) ?? { fileCount: 0, logicalBytes: 0, allocatedBytes: 0 };
  cur.fileCount += count;
  cur.logicalBytes += logical;
  cur.allocatedBytes += allocated;
  map.set(ext, cur);
}

function addAge(
  map: Built["ages"],
  bucket: string,
  count: number,
  logical: number,
  allocated: number,
) {
  const cur = map.get(bucket) ?? { fileCount: 0, logicalBytes: 0, allocatedBytes: 0 };
  cur.fileCount += count;
  cur.logicalBytes += logical;
  cur.allocatedBytes += allocated;
  map.set(bucket, cur);
}

function build(draft: Draft, parentPath: string, depth: number, into: Built): ScanFolder {
  const path = depth === 0 ? draft.name : `${parentPath}\\${draft.name}`;
  const children = (draft.children ?? []).map((child) => build(child, path, depth + 1, into));
  let logical = 0;
  let allocated = 0;
  let fileCount = 0;

  for (const file of draft.files ?? []) {
    const alloc = file.allocated ?? file.logical;
    logical += file.logical;
    allocated += alloc;
    fileCount += 1;
    const extension = extOf(file.name);
    const full = `${path}\\${file.name}`;
    into.files.push({
      path: full,
      name: file.name,
      extension,
      logicalBytes: file.logical,
      allocatedBytes: alloc,
      modifiedUtc: modifiedFromAge(file.ageDays),
    });
    addExt(into.extensions, extension, 1, file.logical, alloc);
    addAge(into.ages, ageBucket(file.ageDays), 1, file.logical, alloc);
  }

  for (const bulk of draft.bulk ?? []) {
    const alloc = Math.round(bulk.totalBytes * (bulk.allocatedRatio ?? 1));
    logical += bulk.totalBytes;
    allocated += alloc;
    fileCount += bulk.count;
    addExt(into.extensions, bulk.ext, bulk.count, bulk.totalBytes, alloc);
    addAge(into.ages, ageBucket(bulk.ageDays), bulk.count, bulk.totalBytes, alloc);
  }

  for (const child of children) {
    logical += child.logicalBytes;
    allocated += child.allocatedBytes;
    fileCount += child.fileCount;
  }

  const folderCount = children.reduce((sum, child) => sum + 1 + child.folderCount, 0);
  const node: ScanFolder = {
    name: draft.name,
    path,
    logicalBytes: logical,
    allocatedBytes: allocated,
    fileCount,
    folderCount,
    children,
  };
  if (depth > 0) {
    into.folders.push({
      path,
      name: draft.name,
      logicalBytes: logical,
      allocatedBytes: allocated,
      fileCount,
      depth,
    });
  }
  return node;
}

function buildScan(): ScanReport {
  const acc = emptyBuiltMaps();
  const tree = build(volume, "", 0, acc);
  const largestFiles = [...acc.files].sort((a, b) => b.logicalBytes - a.logicalBytes).slice(0, 25);
  const largestFolders = [...acc.folders].sort((a, b) => b.logicalBytes - a.logicalBytes);
  const extensions = [...acc.extensions.entries()]
    .map(([extension, stat]) => ({ extension, ...stat }))
    .sort((a, b) => b.logicalBytes - a.logicalBytes);
  const ages = AGE_ORDER.map((bucket) => {
    const stat = acc.ages.get(bucket) ?? { fileCount: 0, logicalBytes: 0, allocatedBytes: 0 };
    return { bucket, ...stat };
  });

  const iso = 8.2 * GB;
  const bak = 96 * GB;
  return {
    kind: "scan",
    tool: "SizeTree.Sample",
    version: "1.0",
    scannedAt: SCANNED_AT,
    host: "FS-DATA-01",
    root: "D:\\",
    elapsedMs: 186_000,
    summary: {
      logicalBytes: tree.logicalBytes,
      allocatedBytes: tree.allocatedBytes,
      fileCount: tree.fileCount,
      folderCount: tree.folderCount,
      deniedCount: 2,
      reparseSkipped: 1,
      duplicateGroups: 2,
      duplicateWasteBytes: bak + iso,
      allocatedCollected: true,
    },
    tree,
    largestFolders,
    largestFiles,
    extensions,
    ages,
    duplicates: [
      {
        match: "sha256",
        hash: "9f2c1a0e4b77d3c1a6e58b0d44c91f0a2e7b6d55c3a81f904e2d7c6b5a493018",
        logicalBytes: bak,
        count: 2,
        wasteBytes: bak,
        paths: [
          "D:\\SQL\\Backup\\FULL\\AppDB_full_20261102.bak",
          "D:\\SQL\\Backup\\FULL\\AppDB_full_20261102_copy.bak",
        ],
      },
      {
        match: "sha256",
        hash: "11ab90c4d55e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f0",
        logicalBytes: iso,
        count: 2,
        wasteBytes: iso,
        paths: [
          "D:\\Shares\\Engineering\\Installers\\vs_enterprise.iso",
          "D:\\Shares\\Software\\ISO\\vs_enterprise.iso",
        ],
      },
    ],
    errors: [
      { path: "D:\\System Volume Information", message: "Access is denied." },
      { path: "D:\\Shares\\Finance\\Confidential", message: "Access is denied." },
      {
        path: "D:\\Users\\Profiles\\admin\\Application Data",
        message: "Reparse point skipped (junction or symlink).",
      },
    ],
  };
}

export const sampleScan: ScanReport = buildScan();

const beforeLogical = Math.round(sampleScan.summary.logicalBytes * 0.91);

export const sampleCompare: CompareReport = {
  kind: "compare",
  tool: "SizeTree.Compare",
  version: "1.0",
  generatedAt: "2026-11-03T01:12:00Z",
  before: {
    label: "D:\\  ·  2026-10-06",
    scannedAt: "2026-10-06T02:15:00Z",
    logicalBytes: beforeLogical,
  },
  after: {
    label: "D:\\  ·  2026-11-03",
    scannedAt: SCANNED_AT,
    logicalBytes: sampleScan.summary.logicalBytes,
  },
  grew: [
    {
      path: "D:\\SQL\\Backup\\FULL",
      name: "FULL",
      beforeBytes: 190 * GB,
      afterBytes: 286 * GB,
      deltaBytes: 96 * GB,
    },
    {
      path: "D:\\Kafka\\logs",
      name: "logs",
      beforeBytes: 112 * GB,
      afterBytes: 171.4 * GB,
      deltaBytes: 59.4 * GB,
    },
    {
      path: "D:\\IIS\\logs",
      name: "logs",
      beforeBytes: 27 * GB,
      afterBytes: 53.8 * GB,
      deltaBytes: 26.8 * GB,
    },
    {
      path: "D:\\SQL\\LOG",
      name: "LOG",
      beforeBytes: 31 * GB,
      afterBytes: 57 * GB,
      deltaBytes: 26 * GB,
    },
  ],
  shrunk: [
    {
      path: "D:\\Elastic\\nodes\\0\\indices",
      name: "indices",
      beforeBytes: 398 * GB,
      afterBytes: 336.2 * GB,
      deltaBytes: -61.8 * GB,
    },
    {
      path: "D:\\Temp",
      name: "Temp",
      beforeBytes: 48 * GB,
      afterBytes: 15.8 * GB,
      deltaBytes: -32.2 * GB,
    },
    {
      path: "D:\\SCCM\\ContentLib",
      name: "ContentLib",
      beforeBytes: 51 * GB,
      afterBytes: 34 * GB,
      deltaBytes: -17 * GB,
    },
  ],
  added: [
    {
      path: "D:\\Kafka\\logs\\payments-0.log",
      name: "payments-0.log",
      beforeBytes: 0,
      afterBytes: 19 * GB,
      deltaBytes: 19 * GB,
    },
  ],
  removed: [
    {
      path: "D:\\Shares\\Engineering\\VM\\old-build.vhdx",
      name: "old-build.vhdx",
      beforeBytes: 80 * GB,
      afterBytes: 0,
      deltaBytes: -80 * GB,
    },
  ],
};
