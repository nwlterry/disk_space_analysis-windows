import type { ScanFolder, SizeMode } from "@/lib/disk/types";

export function sizeOf(
  node: { logicalBytes: number; allocatedBytes: number },
  mode: SizeMode,
  allocatedCollected: boolean,
): number {
  if (mode === "allocated" && allocatedCollected) return node.allocatedBytes;
  return node.logicalBytes;
}

export function findFolder(node: ScanFolder, path: string): ScanFolder | null {
  if (node.path === path) return node;
  for (const child of node.children) {
    const found = findFolder(child, path);
    if (found) return found;
  }
  return null;
}

export function breadcrumb(root: ScanFolder, path: string): ScanFolder[] {
  const chain = [root];
  if (root.path === path) return chain;
  let current = root;
  let guard = 0;
  while (current.path !== path && guard < 64) {
    const next = current.children.find(
      (child) => path === child.path || path.startsWith(`${child.path}\\`) || path.startsWith(`${child.path}/`),
    );
    if (!next) break;
    chain.push(next);
    current = next;
    guard += 1;
  }
  return chain;
}

export function matchingPaths(root: ScanFolder, query: string): Set<string> | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const visible = new Set<string>();
  const visit = (node: ScanFolder): boolean => {
    const self = node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);
    let childHit = false;
    for (const child of node.children) {
      if (visit(child)) childHit = true;
    }
    if (self || childHit) {
      visible.add(node.path);
      return true;
    }
    return false;
  };
  visit(root);
  return visible;
}
