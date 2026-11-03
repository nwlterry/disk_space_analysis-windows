import { useMemo, useState } from "react";
import { formatBytes, formatCount, formatPercent, formatWhen } from "@/lib/disk/format";
import type { CompareReport, ScanReport, SizeMode } from "@/lib/disk/types";

const POWERSHELL = String.raw`Set-ExecutionPolicy -Scope Process Bypass
.\Get-DiskAnalysis.ps1 -Path D:\ -OutDir C:\SizeTreeReports -Duplicates -HashDuplicates -AllocatedSize`;

const COMPARE = String.raw`.\Compare-DiskAnalysis.ps1 -Before C:\SizeTreeReports\older-folders.csv -After C:\SizeTreeReports\latest-folders.csv -OutDir C:\SizeTreeReports\compare`;

const DOTNET_BUILD = String.raw`dotnet publish .\SizeTree.csproj -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o .\publish`;

const DOTNET_SCAN = String.raw`.\publish\SizeTree.exe scan --path D:\ --out C:\SizeTreeReports --duplicates --hash --allocated`;

export function FilesPanel({ report, mode }: { report: ScanReport; mode: SizeMode }) {
  const [sort, setSort] = useState<"size" | "name" | "modified">("size");
  const [ext, setExt] = useState("all");
  const extensions = useMemo(() => {
    const set = new Set(report.largestFiles.map((file) => file.extension));
    return ["all", ...[...set].sort()];
  }, [report.largestFiles]);
  const rows = useMemo(() => {
    const filtered =
      ext === "all" ? report.largestFiles : report.largestFiles.filter((file) => file.extension === ext);
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "modified") return b.modifiedUtc.localeCompare(a.modifiedUtc);
      const av = mode === "allocated" && report.summary.allocatedCollected ? a.allocatedBytes : a.logicalBytes;
      const bv = mode === "allocated" && report.summary.allocatedCollected ? b.allocatedBytes : b.logicalBytes;
      return bv - av;
    });
    return copy;
  }, [ext, mode, report, sort]);
  const total = report.summary.logicalBytes;

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Select label="Sort" value={sort} onChange={(value) => setSort(value as typeof sort)}
          options={[
            ["size", "Size"],
            ["name", "Name"],
            ["modified", "Modified"],
          ]}
        />
        <Select
          label="Type"
          value={ext}
          onChange={setExt}
          options={extensions.map((item) => [item, item === "all" ? "All types" : item])}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-surface text-xs text-faint">
            <tr>
              <th className="py-2 pr-3 font-medium">File</th>
              <th className="py-2 pr-3 font-medium">Size</th>
              <th className="hidden py-2 font-medium sm:table-cell">Modified</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((file) => {
              const bytes =
                mode === "allocated" && report.summary.allocatedCollected
                  ? file.allocatedBytes
                  : file.logicalBytes;
              return (
                <tr key={file.path} className="border-t border-line align-top">
                  <td className="max-w-0 py-2 pr-3">
                    <div className="truncate text-fg" title={file.path}>
                      {file.name}
                    </div>
                    <div className="truncate font-mono text-xs text-faint" title={file.path}>
                      {file.path}
                    </div>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <div className="font-mono text-fg">{formatBytes(bytes)}</div>
                    <div className="font-mono text-xs text-faint">{formatPercent(file.logicalBytes, total)}</div>
                  </td>
                  <td className="hidden py-2 whitespace-nowrap font-mono text-xs text-muted sm:table-cell">
                    {formatWhen(file.modifiedUtc)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="py-6 text-sm text-muted">No files in this report.</p> : null}
      </div>
    </div>
  );
}

export function TypesPanel({ report }: { report: ScanReport }) {
  const max = report.extensions[0]?.logicalBytes ?? 1;
  return (
    <ul className="flex flex-col gap-3 overflow-auto pr-1">
      {report.extensions.map((row) => (
        <li key={row.extension}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-mono text-fg">{row.extension}</span>
            <span className="shrink-0 font-mono text-xs text-muted">
              {formatBytes(row.logicalBytes)} · {formatCount(row.fileCount)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(2, (row.logicalBytes / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AgesPanel({ report }: { report: ScanReport }) {
  const max = Math.max(1, ...report.ages.map((row) => row.logicalBytes));
  return (
    <ul className="flex flex-col gap-3 overflow-auto pr-1">
      {report.ages.map((row) => (
        <li key={row.bucket}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-fg">{row.bucket}</span>
            <span className="shrink-0 font-mono text-xs text-muted">
              {formatBytes(row.logicalBytes)} · {formatCount(row.fileCount)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-ok"
              style={{ width: `${row.logicalBytes <= 0 ? 0 : Math.max(2, (row.logicalBytes / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DupesPanel({ report }: { report: ScanReport }) {
  if (report.duplicates.length === 0) {
    return (
      <p className="text-sm text-muted">
        No duplicate groups in this report. Re-run with <span className="font-mono text-fg">-Duplicates</span> or{" "}
        <span className="font-mono text-fg">--duplicates</span>. Add hashing to confirm byte-identical copies.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-4 overflow-auto pr-1">
      {report.duplicates.map((group) => (
        <li key={`${group.hash ?? group.paths[0]}-${group.logicalBytes}`} className="rounded-lg border border-line bg-bg p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-sm text-fg">
              {group.count} × {formatBytes(group.logicalBytes)}
            </span>
            <span className="font-mono text-xs text-danger">waste {formatBytes(group.wasteBytes)}</span>
          </div>
          <p className="mt-1 text-xs text-faint">
            Matched by {group.match === "sha256" ? "SHA-256" : "size only"}
            {group.hash ? ` · ${group.hash.slice(0, 16)}…` : ""}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {group.paths.map((path) => (
              <li key={path} className="truncate font-mono text-xs text-muted" title={path}>
                {path}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function ErrorsPanel({ report }: { report: ScanReport }) {
  if (report.errors.length === 0) {
    return <p className="text-sm text-muted">No access errors or skipped links were recorded.</p>;
  }
  return (
    <ul className="flex flex-col gap-3 overflow-auto pr-1">
      {report.errors.map((error) => (
        <li key={`${error.path}-${error.message}`} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
          <div className="truncate font-mono text-sm text-fg" title={error.path}>
            {error.path}
          </div>
          <div className="text-xs text-danger">{error.message}</div>
        </li>
      ))}
    </ul>
  );
}

export function ToolsPanel() {
  return (
    <div className="flex flex-col gap-4 overflow-auto pr-1 text-sm text-muted">
      <p>
        Both scanners write the same JSON the viewer opens, plus CSV and HTML. Windows PowerShell 5.1 is enough
        for Server 2016. The .NET tool needs the .NET 8 runtime, or a self-contained publish.
      </p>
      <a
        href="/downloads/SizeTree-tools.zip"
        download
        className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 font-medium text-ink"
      >
        Download scanners (.zip)
      </a>
      <Command title="PowerShell scan" text={POWERSHELL} />
      <Command title="PowerShell compare" text={COMPARE} />
      <Command title=".NET publish" text={DOTNET_BUILD} />
      <Command title=".NET scan" text={DOTNET_SCAN} />
      <p className="text-xs text-faint">
        Self-contained, no runtime install: add <span className="font-mono">--self-contained true</span> to the
        publish command. Use <span className="font-mono">-AllocatedSize</span> /{" "}
        <span className="font-mono">--allocated</span> to measure NTFS allocation, compression, and sparse files.
        Junctions are not followed.
      </p>
    </div>
  );
}

export function CompareView({ report }: { report: CompareReport }) {
  const delta = report.after.logicalBytes - report.before.logicalBytes;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Earlier" value={formatBytes(report.before.logicalBytes)} hint={report.before.label} />
        <Metric label="Later" value={formatBytes(report.after.logicalBytes)} hint={report.after.label} />
        <Metric
          label="Net change"
          value={`${delta >= 0 ? "+" : ""}${formatBytes(delta)}`}
          hint={delta >= 0 ? "Volume grew" : "Volume shrank"}
        />
      </div>
      <ChangeTable title="Grew" rows={report.grew} tone="danger" />
      <ChangeTable title="Shrank" rows={report.shrunk} tone="ok" />
      <ChangeTable title="Added" rows={report.added} tone="danger" />
      <ChangeTable title="Removed" rows={report.removed} tone="ok" />
    </div>
  );
}

function ChangeTable({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: CompareReport["grew"];
  tone: "danger" | "ok";
}) {
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.deltaBytes)));
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-fg">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">None.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={`${title}-${row.path}`}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-fg" title={row.path}>
                  {row.path}
                </span>
                <span className={`shrink-0 font-mono text-xs ${tone === "danger" ? "text-danger" : "text-ok"}`}>
                  {row.deltaBytes >= 0 ? "+" : ""}
                  {formatBytes(row.deltaBytes)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface2">
                <div
                  className={`h-full rounded-full ${tone === "danger" ? "bg-danger" : "bg-ok"}`}
                  style={{ width: `${Math.max(2, (Math.abs(row.deltaBytes) / max) * 100)}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-xs text-faint">
                {formatBytes(row.beforeBytes)} → {formatBytes(row.afterBytes)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-3">
      <div className="text-xs text-faint">{label}</div>
      <div className="mt-1 font-mono text-lg text-fg">{value}</div>
      <div className="mt-1 truncate text-xs text-muted">{hint}</div>
    </div>
  );
}

function Command({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-xs text-faint">{title}</h3>
        <button
          type="button"
          className="h-8 rounded-md px-2 text-xs text-accent hover:bg-surface2"
          onClick={() => {
            void navigator.clipboard.writeText(text).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg">
        {text}
      </pre>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-faint">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-line bg-bg px-2 text-sm text-fg"
      >
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
