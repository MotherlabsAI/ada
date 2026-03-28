import type { OmniNode, ProviderConfig, PulseResult } from './types'
import { generate } from './llm'
import { computeEmbeddings, cosineSimilarity } from './embedder'
import { pruneNodes } from './skeptic'
import { projectTo3D } from './umap'
import { estimateTopology } from './topology'

const PRIMITIVES = ['Distinction', 'Composition', 'Self-reference'] as const

function buildPrompt(primitive: string, concept: string): { system: string; user: string } {
  const prompts: Record<string, { system: string; user: string }> = {
    Distinction: {
      system: 'You are a boundary analyst. Find what separates things.',
      user: `CONCEPT: "${concept.slice(0, 300)}"\n\nWhat is this concept NOT? Where does it end? What is the nearest concept that is fundamentally different, and why? Name the specific boundary. Write 2-4 sentences.`,
    },
    Composition: {
      system: 'You are a structural analyst. Find what composes things.',
      user: `CONCEPT: "${concept.slice(0, 300)}"\n\nWhat are the irreducible components of this concept? What larger systems depend on it? What hidden sub-structure does it have? Write 2-4 sentences.`,
    },
    'Self-reference': {
      system: 'You are a recursion analyst. Find how things define themselves.',
      user: `CONCEPT: "${concept.slice(0, 300)}"\n\nHow does examining this concept change it? What happens when you apply it to itself? What feedback loops does it create? Write 2-4 sentences.`,
    },
  }
  return prompts[primitive] ?? prompts.Distinction
}

function makeId(content: string, depth: number): string {
  const hash = Array.from(content.slice(0, 100)).reduce(
    (h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0
  )
  return `n_${depth}_${Math.abs(hash).toString(36)}`
}

function complexity(text: string): number {
  const words = text.split(/\s+/)
  const unique = new Set(words.map(w => w.toLowerCase()))
  const avgLen = words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1)
  return Math.round(((unique.size / Math.max(words.length, 1)) * 5 + avgLen * 0.3) * 100) / 100
}

export interface ExpandOptions {
  config: ProviderConfig
  maxDepth: number
  branchMode: 'fixed' | 'adaptive'
  onNode?: (node: OmniNode) => void
}

export async function runPulse(
  seed: string,
  pulseNum: number,
  opts: ExpandOptions,
): Promise<PulseResult> {
  const allNodes: OmniNode[] = []
  const tokenUsage = { input: 0, output: 0, cost_usd: 0 }

  async function expand(concept: string, depth: number, parentNode: OmniNode | null) {
    if (depth > opts.maxDepth) return

    for (const primitive of PRIMITIVES) {
      const { system, user } = buildPrompt(primitive, concept)

      let content: string
      let tokens = { input: 0, output: 0 }
      try {
        const res = await generate(opts.config, system, user)
        content = res.content
        tokens = res.tokens
      } catch {
        content = `[${primitive}] of "${concept.slice(0, 50)}": ${primitive} analysis pending.`
      }

      tokenUsage.input += tokens.input
      tokenUsage.output += tokens.output

      const node: OmniNode = {
        id: makeId(content, depth),
        content,
        domain: primitive,
        depth,
        alive: true,
        score: 0,
        complexity: complexity(content),
        similarity_to_seed: 0,
        embedding: null,
        children: [],
      }

      allNodes.push(node)
      if (parentNode) parentNode.children.push(node)
      opts.onNode?.(node)

      if (depth < opts.maxDepth) {
        await expand(content, depth + 1, node)
      }
    }
  }

  await expand(seed, 0, null)

  const texts = allNodes.map(n => n.content)
  const embeddings = computeEmbeddings(texts)
  const seedEmbedding = computeEmbeddings([seed])[0] ?? embeddings[0]

  for (let i = 0; i < allNodes.length; i++) {
    allNodes[i].embedding = embeddings[i]
    allNodes[i].similarity_to_seed = seedEmbedding
      ? cosineSimilarity(embeddings[i], seedEmbedding) : 0
  }

  const rootNodes = allNodes.filter(n => n.depth === 0)
  pruneNodes(rootNodes)

  const aliveEmbeddings = allNodes
    .filter(n => n.embedding)
    .map(n => n.embedding!)
  const umap3d = projectTo3D(aliveEmbeddings)
  const topology = umap3d.length > 2 ? estimateTopology(umap3d) : null
  const alive = allNodes.filter(n => n.alive).length

  return {
    pulse: pulseNum,
    run_id: `run_${Date.now()}_${pulseNum}`,
    total_nodes: allNodes.length,
    surviving_nodes: alive,
    pruned_nodes: allNodes.length - alive,
    topology,
    nodes: rootNodes,
    umap_3d: umap3d,
    token_usage: tokenUsage,
  }
}
