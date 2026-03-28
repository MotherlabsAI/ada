import { UMAP } from 'umap-js'

export function projectTo3D(embeddings: number[][]): number[][] {
  const n = embeddings.length
  if (n < 3) {
    return embeddings.map(() => [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ])
  }

  const nNeighbors = Math.min(15, n - 1)
  const umap = new UMAP({ nComponents: 3, nNeighbors, minDist: 0.1, spread: 1.0 })
  return umap.fit(embeddings) as number[][]
}
