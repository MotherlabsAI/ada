export function computeEmbeddings(texts: string[]): number[][] {
  if (texts.length === 0) return []

  const docs = texts.map(t =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2)
  )

  const vocab = new Map<string, number>()
  const df = new Map<string, number>()

  for (const doc of docs) {
    const seen = new Set<string>()
    for (const word of doc) {
      if (!vocab.has(word)) vocab.set(word, vocab.size)
      if (!seen.has(word)) {
        df.set(word, (df.get(word) ?? 0) + 1)
        seen.add(word)
      }
    }
  }

  const vocabSize = vocab.size
  const N = docs.length

  return docs.map(doc => {
    const tf = new Map<string, number>()
    for (const word of doc) {
      tf.set(word, (tf.get(word) ?? 0) + 1)
    }
    const vec = new Float64Array(vocabSize)
    for (const [word, count] of tf) {
      const idx = vocab.get(word)!
      const idf = Math.log(N / (df.get(word) ?? 1))
      vec[idx] = (count / doc.length) * idf
    }
    return Array.from(vec)
  })
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
