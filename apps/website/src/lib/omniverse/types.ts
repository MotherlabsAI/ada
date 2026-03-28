export interface OmniNode {
  id: string
  content: string
  domain: string
  depth: number
  alive: boolean
  score: number
  complexity: number
  similarity_to_seed: number
  embedding: number[] | null
  children: OmniNode[]
}

export interface PulseResult {
  pulse: number
  run_id: string
  total_nodes: number
  surviving_nodes: number
  pruned_nodes: number
  topology: { h0: number; h1: number } | null
  nodes: OmniNode[]
  umap_3d: number[][] | null
  token_usage: { input: number; output: number; cost_usd: number }
}

export interface ProviderConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'ollama'
  model: string
  apiKey: string
  baseUrl?: string
}

export interface EngineConfig {
  engine: 'primitive' | 'legacy'
  maxDepth: number
  branchMode: 'fixed' | 'adaptive'
  prunePct: number
}

export const PROVIDER_PRESETS: Record<string, { models: string[]; default: string }> = {
  openai: {
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    default: 'gpt-4o-mini',
  },
  anthropic: {
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
    default: 'claude-sonnet-4-20250514',
  },
  google: {
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    default: 'gemini-2.0-flash',
  },
  ollama: {
    models: [],
    default: 'llama3',
  },
}
