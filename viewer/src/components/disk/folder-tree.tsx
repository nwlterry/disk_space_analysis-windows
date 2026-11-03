import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes, formatPercent } from "@/lib/disk/format";
import { matchingPaths, sizeOf } from "@/lib/disk/tree";
import type { ScanFolder, SizeMode } from "@/lib/disk/types";

export function FolderTree({
  root,
  focus,
  mode,
  allocatedCollected,
  query,
  onOpen,
}: {
  root: ScanFolder;
  focus: string;
  mode: SizeMode;
  allocatedCollected: boolean;
  query: string;
  onOpen: (path: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set([root.path]));
  const visible = matchingPaths(root, query);
  const total = sizeOf(root, mode, allocatedCollected);

  useEffect(() => {
    setOpen(new Set([root.path, ...root.children.map((child) => child.path)]));
  }, [root]);

  return (
    <div className="min-h-0 flex-1 overflow-auto pr-1">
      <TreeNode
        node={root}
        depth={0}
        focus={focus}
        mode={mode}
        allocatedCollected={allocatedCollected}
        total={total}
        open={open}
        visible={visible}
        forceOpen={visible !== null}
        onToggle={(path) => {
          setOpen((current) => {
            const next = new Set(current);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
          });
        }}
        onOpen={onOpen}
      />
    </div>
  );
}

function TreeNode({
  node,
  depth,
  focus,
  mode,
  allocatedCollected,
  total,
  open,
  visible,
  forceOpen,
  onToggle,
  onOpen,
}: {
  node: ScanFolder;
  depth: number;
  focus: string;
  mode: SizeMode;
  allocatedCollected: boolean;
  total: number;
  open: Set<string>;
  visible: Set<string> | null;
  forceOpen: boolean;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
}) {
  if (visible && !visible.has(node.path)) return null;
  const kids = node.children.filter((child) => !visible || visible.has(child.path));
  const expanded = forceOpen || open.has(node.path);
  const bytes = sizeOf(node, mode, allocatedCollected);
  const selected = node.path === focus;

  return (
    <div>
      <div className="flex items-stretch" style={{ paddingLeft: `${depth * 0.75}rem` }}>
        {kids.length > 0 ? (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            onClick={() => onToggle(node.path)}
            className="grid h-11 w-8 shrink-0 place-items-center text-muted hover:text-fg"
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="w-8 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onOpen(node.path)}
          className={`flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left ${
            selected ? "bg-surface2 text-fg" : "text-muted hover:bg-surface2 hover:text-fg"
          }`}
        >
          <span className="min-w-0 flex-1 truncate text-sm">{node.name}</span>
          <span className="shrink-0 font-mono text-xs text-faint">{formatPercent(bytes, total)}</span>
          <span className="w-20 shrink-0 text-right font-mono text-xs text-fg">{formatBytes(bytes)}</span>
        </button>
      </div>
      {expanded
        ? kids.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              focus={focus}
              mode={mode}
              allocatedCollected={allocatedCollected}
              total={total}
              open={open}
              visible={visible}
              forceOpen={forceOpen}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))
        : null}
    </div>
  );
}
