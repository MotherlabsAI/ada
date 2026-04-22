import type { PackageDependencyEdge, BuildOrder } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  hasCycle: boolean;
  cycleDescription?: string | undefined;
  missingPackages: string[];
}

export function validateDependencyGraph(
  packageNames: string[],
  edges: PackageDependencyEdge[],
): ValidationResult {
  const nameSet = new Set(packageNames);
  const missingPackages: string[] = [];

  for (const edge of edges) {
    if (!nameSet.has(edge.fromPackage)) missingPackages.push(edge.fromPackage);
    if (!nameSet.has(edge.toPackage)) missingPackages.push(edge.toPackage);
  }

  // Build adjacency list for cycle detection via DFS
  const adj = new Map<string, string[]>();
  for (const name of packageNames) adj.set(name, []);
  for (const edge of edges) {
    adj.get(edge.fromPackage)?.push(edge.toPackage);
  }

  // DFS cycle detection
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  for (const name of packageNames) color.set(name, WHITE);

  let cycleDescription: string | undefined;
  const stack: string[] = [];

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    stack.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      if (color.get(neighbor) === GRAY) {
        const idx = stack.indexOf(neighbor);
        cycleDescription = [...stack.slice(idx), neighbor].join(" → ");
        return true;
      }
      if (color.get(neighbor) === WHITE && dfs(neighbor)) return true;
    }
    stack.pop();
    color.set(node, BLACK);
    return false;
  }

  let hasCycle = false;
  for (const name of packageNames) {
    if (color.get(name) === WHITE && dfs(name)) {
      hasCycle = true;
      break;
    }
  }

  return {
    valid: !hasCycle && missingPackages.length === 0,
    hasCycle,
    cycleDescription,
    missingPackages: [...new Set(missingPackages)],
  };
}

export function topoOrder(
  packageNames: string[],
  edges: PackageDependencyEdge[],
): BuildOrder {
  const nameSet = new Set(packageNames);

  // Kahn's algorithm
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const name of packageNames) {
    inDegree.set(name, 0);
    adj.set(name, []);
  }

  for (const edge of edges) {
    // edge: fromPackage depends on toPackage → toPackage must come first
    // So toPackage → fromPackage in the build order graph
    adj.get(edge.toPackage)?.push(edge.fromPackage);
    inDegree.set(edge.fromPackage, (inDegree.get(edge.fromPackage) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [name, deg] of inDegree) {
    if (deg === 0) queue.push(name);
  }
  queue.sort(); // deterministic ordering within the same wave

  const ordered: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    ordered.push(node);
    for (const neighbor of (adj.get(node) ?? []).sort()) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  const hasCycle = ordered.length < packageNames.length;
  const missingPackages = packageNames.filter(
    (n) => !nameSet.has(n) || !ordered.includes(n),
  );

  if (hasCycle) {
    return {
      orderedPackages: ordered,
      edgeCount: edges.length,
      hasCycle: true,
      cycleDescription: `Cycle detected — only ${ordered.length}/${packageNames.length} packages resolved. Missing: ${missingPackages.join(", ")}`,
    };
  }

  // Filter to only packages in input set (should already be filtered by inDegree init)
  const filteredOrdered = ordered.filter((n) => nameSet.has(n));

  return {
    orderedPackages: filteredOrdered,
    edgeCount: edges.length,
    hasCycle: false,
  };
}
