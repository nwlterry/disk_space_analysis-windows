import { useMemo, useRef, useState } from "react";
import { FolderTree } from "@/components/disk/folder-tree";
import {
  AgesPanel,
  CompareView,
  DupesPanel,
  ErrorsPanel,
  FilesPanel,
  ToolsPanel,
  TypesPanel,
} from "@/components/disk/report-panels";
import { TreemapView } from "@/components/disk/treemap-view";
import { formatBytes, formatCount, formatDuration, formatPercent, formatWhen } from "@/lib/disk/format";
import { parseReportJson } from "@/lib/disk/parse-scan";
import { sampleCompare, sampleScan } from "@/lib/disk/sample-scan";
import { breadcrumb, findFolder } from "@/lib/disk/tree";
import type { CompareReport, ScanReport, SizeMode } from "@/lib/disk/types";

type SideTab = "files" | "types" | "age" | "dupes" | "errors" | "tools";
type MobilePane = "map" | "tree" | SideTab;

type View =
  | { mode: "scan"; report: ScanReport; source: string }
  | { mode: "compare"; report: CompareReport; source: string };

const SIDE_TABS: Array<[SideTab, string]> = [
  ["files", "Files"],
  ["types", "Types"],
  ["age", "Age"],
  ["dupes", "Dupes"],
  ["errors", "Errors"],
  ["tools", "Scanners"],
];

export function SizeTreeApp() {
  const [view, setView] = useState<View>({ mode: "scan", report: sampleScan, source: "Sample volume" });
  const [focus, setFocus] = useState(sampleScan.tree.path);
  const [sizeMode, setSizeMode] = useState<SizeMode>("logical");
  const [tab, setTab] = useState<SideTab>("files");
  const [pane, setPane] = useState<MobilePane>("map");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scan = view.mode === "scan" ? view.report : null;
  const node = useMemo(() => {
    if (!scan) return null;
    return findFolder(scan.tree, focus) ?? scan.tree;
  }, [focus, scan]);
  const crumbs = scan && node ? breadcrumb(scan.tree, node.path) : [];

  function loadScan(report: ScanReport, source: string) {
    setView({ mode: "scan", report, source });
    setFocus(report.tree.path);
    setQuery("");
    setNotice(null);
    setPane("map");
    if (!report.summary.allocatedCollected) setSizeMode("logical");
  }

  function loadCompare(report: CompareReport, source: string) {
    setView({ mode: "compare", report, source });
    setNotice(null);
  }

  async function onFile(file: File) {
    try {
      const text = await file.text();
      const loaded = parseReportJson(text);
      if (loaded.mode === "scan") loadScan(loaded.report, file.name);
      else loadCompare(loaded.report, file.name);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read that report.");
    }
  }

  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-wide text-accent">SIZETREE</p>
              <h1 className="text-xl font-medium text-fg sm:text-2xl">Disk space analysis</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Same job as Tree Size: who is using the volume, which files, which types, and what changed.
                Scan on the server, then open the JSON here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-11 rounded-md border border-line bg-surface px-3 text-sm text-fg hover:bg-surface2"
                onClick={() => loadScan(sampleScan, "Sample volume")}
              >
                Sample volume
              </button>
              <button
                type="button"
                className="h-11 rounded-md border border-line bg-surface px-3 text-sm text-fg hover:bg-surface2"
                onClick={() => loadCompare(sampleCompare, "Sample changes")}
              >
                Sample changes
              </button>
              <button
                type="button"
                className="h-11 rounded-md bg-accent px-3 text-sm font-medium text-ink"
                onClick={() => fileRef.current?.click()}
              >
                Open report
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void onFile(file);
                }}
              />
            </div>
          </div>
          {notice ? (
            <p className="rounded-md border border-danger/40 bg-surface px-3 py-2 text-sm text-danger">{notice}</p>
          ) : null}
          {scan ? (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Stat
                label="Logical size"
                value={formatBytes(scan.summary.logicalBytes)}
                hint={`${view.source} · ${scan.host}`}
              />
              <Stat
                label={scan.summary.allocatedCollected ? "Allocated" : "Allocated not scanned"}
                value={scan.summary.allocatedCollected ? formatBytes(scan.summary.allocatedBytes) : "—"}
                hint={allocationHint(scan)}
              />
              <Stat
                label="Files"
                value={formatCount(scan.summary.fileCount)}
                hint={`${formatCount(scan.summary.folderCount)} folders · ${formatDuration(scan.elapsedMs)}`}
              />
              <Stat
                label="Duplicate waste"
                value={formatBytes(scan.summary.duplicateWasteBytes)}
                hint={`${formatCount(scan.summary.duplicateGroups)} groups · ${formatCount(scan.summary.deniedCount)} denied`}
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {view.mode === "compare" ? (
          <CompareView report={view.report} />
        ) : scan && node ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm" aria-label="Folder path">
                {crumbs.map((crumb, index) => (
                  <span key={crumb.path} className="flex min-w-0 items-center gap-1">
                    {index > 0 ? <span className="text-faint">/</span> : null}
                    <button
                      type="button"
                      onClick={() => setFocus(crumb.path)}
                      className={`max-w-48 truncate rounded-md px-2 py-1 ${
                        crumb.path === node.path ? "bg-surface2 text-fg" : "text-muted hover:text-fg"
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
              </nav>
              <div className="flex h-10 rounded-md border border-line p-0.5 text-sm">
                <button
                  type="button"
                  onClick={() => setSizeMode("logical")}
                  className={`rounded px-3 ${sizeMode === "logical" ? "bg-surface2 text-fg" : "text-muted"}`}
                >
                  Logical
                </button>
                <button
                  type="button"
                  disabled={!scan.summary.allocatedCollected}
                  onClick={() => setSizeMode("allocated")}
                  className={`rounded px-3 disabled:opacity-40 ${
                    sizeMode === "allocated" ? "bg-surface2 text-fg" : "text-muted"
                  }`}
                >
                  Allocated
                </button>
              </div>
              <p className="w-full font-mono text-xs text-faint sm:w-auto">
                {formatWhen(scan.scannedAt)} · {scan.tool} {scan.version}
              </p>
            </div>

            <div className="mb-3 flex gap-2 overflow-auto lg:hidden">
              {(
                [
                  ["map", "Map"],
                  ["tree", "Tree"],
                  ...SIDE_TABS,
                ] as Array<[MobilePane, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPane(id);
                    if (id !== "map" && id !== "tree") setTab(id);
                  }}
                  className={`h-10 shrink-0 rounded-md px-3 text-sm ${
                    pane === id ? "bg-accent text-ink" : "bg-surface text-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4 lg:min-h-panel lg:flex-row lg:items-stretch">
              <section
                className={`${pane === "tree" ? "flex" : "hidden lg:flex"} min-h-80 w-full flex-col rounded-lg border border-line bg-surface p-3 lg:min-h-panel lg:w-tree lg:shrink-0`}
              >
                <label className="mb-2 block text-xs text-faint">
                  Folders
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Filter path"
                    className="mt-1 h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-fg placeholder:text-faint"
                  />
                </label>
                <FolderTree
                  root={scan.tree}
                  focus={node.path}
                  mode={sizeMode}
                  allocatedCollected={scan.summary.allocatedCollected}
                  query={query}
                  onOpen={(path) => {
                    setFocus(path);
                    setPane("map");
                  }}
                />
              </section>

              <section
                className={`min-w-0 flex-1 rounded-lg border border-line bg-surface p-3 lg:min-h-panel ${
                  pane === "map" ? "block" : "hidden lg:block"
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 className="truncate text-sm font-medium">{node.name}</h2>
                  <p className="shrink-0 font-mono text-xs text-muted">
                    {formatBytes(
                      sizeMode === "allocated" && scan.summary.allocatedCollected
                        ? node.allocatedBytes
                        : node.logicalBytes,
                    )}
                    {" · "}
                    {formatPercent(
                      sizeMode === "allocated" && scan.summary.allocatedCollected
                        ? node.allocatedBytes
                        : node.logicalBytes,
                      sizeMode === "allocated" && scan.summary.allocatedCollected
                        ? scan.summary.allocatedBytes
                        : scan.summary.logicalBytes,
                    )}
                  </p>
                </div>
                <TreemapView
                  node={node}
                  mode={sizeMode}
                  allocatedCollected={scan.summary.allocatedCollected}
                  volumeBytes={
                    sizeMode === "allocated" && scan.summary.allocatedCollected
                      ? scan.summary.allocatedBytes
                      : scan.summary.logicalBytes
                  }
                  onOpen={setFocus}
                />
              </section>

              <section
                className={`${pane !== "map" && pane !== "tree" ? "flex" : "hidden lg:flex"} min-h-80 w-full flex-col rounded-lg border border-line bg-surface p-3 lg:min-h-panel lg:w-side lg:shrink-0`}
              >
                <div className="mb-3 hidden flex-wrap gap-1 lg:flex">
                  {SIDE_TABS.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`h-9 rounded-md px-2.5 text-sm ${
                        tab === id ? "bg-surface2 text-fg" : "text-muted hover:text-fg"
                      }`}
                    >
                      {label}
                      {id === "errors" && scan.errors.length > 0 ? ` ${scan.errors.length}` : ""}
                    </button>
                  ))}
                </div>
                <div className="min-h-0 flex-1">
                  {tab === "files" ? <FilesPanel report={scan} mode={sizeMode} /> : null}
                  {tab === "types" ? <TypesPanel report={scan} /> : null}
                  {tab === "age" ? <AgesPanel report={scan} /> : null}
                  {tab === "dupes" ? <DupesPanel report={scan} /> : null}
                  {tab === "errors" ? <ErrorsPanel report={scan} /> : null}
                  {tab === "tools" ? <ToolsPanel /> : null}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface px-3 py-3">
      <div className="truncate text-xs text-faint">{label}</div>
      <div className="mt-1 truncate font-mono text-lg text-fg">{value}</div>
      <div className="mt-1 truncate text-xs text-muted">{hint}</div>
    </div>
  );
}

function allocationHint(report: ScanReport): string {
  if (!report.summary.allocatedCollected) return "Re-scan with -AllocatedSize";
  const delta = report.summary.logicalBytes - report.summary.allocatedBytes;
  if (delta > 1024 ** 3) return `${formatBytes(delta)} sparse or compressed`;
  if (delta < -(1024 ** 2)) return `${formatBytes(-delta)} cluster slack`;
  return "On-disk allocation";
}
