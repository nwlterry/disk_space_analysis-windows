import { useMemo, useState } from "react";
import { formatBytes, formatPercent } from "@/lib/disk/format";
import { treemapLayout } from "@/lib/disk/treemap";
import { sizeOf } from "@/lib/disk/tree";
import type { ScanFolder, SizeMode } from "@/lib/disk/types";

const FILLS = ["bg-map0", "bg-map1", "bg-map2", "bg-map3", "bg-map4", "bg-map5"] as const;

type Cell = {
  name: string;
  path: string;
  value: number;
  logicalBytes: number;
  allocatedBytes: number;
  fileCount: number;
  drill: boolean;
};

export function TreemapView({
  node,
  mode,
  allocatedCollected,
  volumeBytes,
  onOpen,
}: {
  node: ScanFolder;
  mode: SizeMode;
  allocatedCollected: boolean;
  volumeBytes: number;
  onOpen: (path: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const cells = useMemo(() => {
    const kids = node.children.filter((child) => sizeOf(child, mode, allocatedCollected) > 0);
    const source: Cell[] =
      kids.length > 0
        ? kids.map((child) => ({
            name: child.name,
            path: child.path,
            value: sizeOf(child, mode, allocatedCollected),
            logicalBytes: child.logicalBytes,
            allocatedBytes: child.allocatedBytes,
            fileCount: child.fileCount,
            drill: child.children.length > 0,
          }))
        : [
            {
              name: node.name,
              path: node.path,
              value: Math.max(sizeOf(node, mode, allocatedCollected), 1),
              logicalBytes: node.logicalBytes,
              allocatedBytes: node.allocatedBytes,
              fileCount: node.fileCount,
              drill: false,
            },
          ];
    const capped = capCells(source);
    return treemapLayout(capped);
  }, [allocatedCollected, mode, node]);

  const active = cells.find((cell) => cell.path === hover) ?? null;
  const here = sizeOf(node, mode, allocatedCollected);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative min-h-80 flex-1 overflow-hidden rounded-lg border border-line bg-bg"
        onMouseLeave={() => setHover(null)}
      >
        {cells.map((cell, index) => {
          const showLabel = cell.w >= 12 && cell.h >= 9;
          return (
            <button
              key={cell.path}
              type="button"
              title={cell.path}
              onMouseEnter={() => setHover(cell.path)}
              onFocus={() => setHover(cell.path)}
              onClick={() => {
                if (cell.drill) onOpen(cell.path);
              }}
              className={`absolute overflow-hidden border border-bg text-left ${FILLS[index % FILLS.length]} ${
                cell.drill ? "hover:brightness-110" : ""
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg`}
              style={{
                left: `${cell.x}%`,
                top: `${cell.y}%`,
                width: `${cell.w}%`,
                height: `${cell.h}%`,
              }}
            >
              {showLabel ? (
                <span className="pointer-events-none absolute inset-x-1 top-1 flex max-w-full flex-col gap-0.5">
                  <span className="truncate rounded-sm bg-bg/80 px-1.5 py-0.5 font-mono text-xs text-fg">
                    {cell.name}
                  </span>
                  <span className="w-fit rounded-sm bg-bg/80 px-1.5 py-0.5 font-mono text-xs text-accent2">
                    {formatBytes(cell.value)}
                  </span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 min-h-10 text-sm text-muted">
        {active ? (
          <>
            <span className="text-fg">{active.name}</span>
            {" · "}
            {formatBytes(active.value)}
            {" · "}
            {formatPercent(active.value, here)} of this folder
            {" · "}
            {formatPercent(active.value, volumeBytes)} of volume
            {active.drill ? " · click to open" : ""}
          </>
        ) : (
          <>
            {formatBytes(here)} in {node.name}
            {" · "}
            {formatPercent(here, volumeBytes)} of volume. Click a block to open that folder.
          </>
        )}
      </p>
    </div>
  );
}

function capCells(cells: Cell[]): Cell[] {
  if (cells.length <= 24) return cells;
  const sorted = [...cells].sort((a, b) => b.value - a.value);
  const keep = sorted.slice(0, 23);
  const rest = sorted.slice(23);
  keep.push({
    name: "(other)",
    path: `${sorted[0]?.path ?? "other"}\u0000other`,
    value: rest.reduce((sum, cell) => sum + cell.value, 0),
    logicalBytes: rest.reduce((sum, cell) => sum + cell.logicalBytes, 0),
    allocatedBytes: rest.reduce((sum, cell) => sum + cell.allocatedBytes, 0),
    fileCount: rest.reduce((sum, cell) => sum + cell.fileCount, 0),
    drill: false,
  });
  return keep;
}
