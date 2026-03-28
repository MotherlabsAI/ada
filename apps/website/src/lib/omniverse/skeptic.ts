import type { OmniNode } from './types'
import { cosineSimilarity } from './embedder'

export function scoreNode(node: OmniNode): number {
  const novelty = 1.0 - node.similarity_to_seed
  const cxNorm = Math.min(1.0, Math.max(0.0, (node.complexity - 3.0) / 5.0))
  const words = node.content.toLowerCase().split(/\s+/)
  const uniqueRatio = new Set(words).size / Math.max(words.length, 1)
  const score = novelty * 0.4 + cxNorm * 0.35 + uniqueRatio * 0.25
  return Math.round(Math.min(1.0, Math.max(0.0, score)) * 10000) / 10000
}

export function pruneNodes(nodes: OmniNode[], prunePct = 0.3): OmniNode[] {
  const all: OmniNode[] = []
  function collect(ns: OmniNode[]) {
    for (const n of ns) {
      n.score = scoreNode(n)
      all.push(n)
      if (n.children.length > 0) collect(n.children)
    }
  }
  collect(nodes)

  const byDomain = new Map<string, OmniNode[]>()
  for (const n of all) {
    const group = byDomain.get(n.domain) ?? []
    group.push(n)
    byDomain.set(n.domain, group)
  }

  for (const [, group] of byDomain) {
    group.sort((a, b) => a.score - b.score)
    const cutoffIdx = Math.floor(group.length * prunePct)
    for (let i = 0; i < cutoffIdx; i++) {
      group[i].alive = false
    }
  }

  return nodes
}

export function computeSimilarityToSeed(nodeEmbedding: number[], seedEmbedding: number[]): number {
  return cosineSimilarity(nodeEmbedding, seedEmbedding)
}
