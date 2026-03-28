export interface TopologySignature {
  h0: number
  h1: number
}

export function estimateTopology(coords: number[][], epsilon?: number): TopologySignature {
  const n = coords.length
  if (n < 2) return { h0: n, h1: 0 }

  if (!epsilon) {
    const dists: number[] = []
    for (let i = 0; i < Math.min(n, 50); i++) {
      for (let j = i + 1; j < Math.min(n, 50); j++) {
        dists.push(dist3d(coords[i], coords[j]))
      }
    }
    dists.sort((a, b) => a - b)
    epsilon = dists[Math.floor(dists.length / 2)] * 0.5
  }

  const parent = Array.from({ length: n }, (_, i) => i)
  const rank = new Array(n).fill(0)

  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x])
    return parent[x]
  }

  function union(a: number, b: number) {
    const ra = find(a), rb = find(b)
    if (ra === rb) return
    if (rank[ra] < rank[rb]) parent[ra] = rb
    else if (rank[ra] > rank[rb]) parent[rb] = ra
    else { parent[rb] = ra; rank[ra]++ }
  }

  let edges = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (dist3d(coords[i], coords[j]) < epsilon) {
        union(i, j)
        edges++
      }
    }
  }

  const roots = new Set<number>()
  for (let i = 0; i < n; i++) roots.add(find(i))
  const h0 = roots.size
  const h1 = Math.max(0, edges - n + h0)

  return { h0, h1 }
}

function dist3d(a: number[], b: number[]): number {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
