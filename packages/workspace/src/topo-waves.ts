import type { PackageDependencyEdge } from "./types.js";

export function topoWaves(
  nodes: string[],
  edges: PackageDependencyEdge[],
): string[][] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const name of nodes) {
    inDegree.set(name, 0);
    adj.set(name, []);
  }

  for (const edge of edges) {
    // toPackage must build before fromPackage
    adj.get(edge.toPackage)?.push(edge.fromPackage);
    inDegree.set(edge.fromPackage, (inDegree.get(edge.fromPackage) ?? 0) + 1);
  }

  const waves: string[][] = [];
  let currentWave = [...nodes]
    .filter((n) => (inDegree.get(n) ?? 0) === 0)
    .sort();

  while (currentWave.length > 0) {
    waves.push(currentWave);
    const nextWave: string[] = [];
    for (const node of currentWave) {
      for (const neighbor of (adj.get(node) ?? []).sort()) {
        const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) nextWave.push(neighbor);
      }
    }
    currentWave = nextWave.sort();
  }

  return waves;
}
