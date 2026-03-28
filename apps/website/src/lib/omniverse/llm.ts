import type { ProviderConfig } from './types'

export interface LLMResponse {
  content: string
  tokens: { input: number; output: number }
}

export async function generate(
  config: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<LLMResponse> {
  switch (config.provider) {
    case 'openai': return callOpenAI(config, systemPrompt, userPrompt)
    case 'anthropic': return callAnthropic(config, systemPrompt, userPrompt)
    case 'google': return callGoogle(config, systemPrompt, userPrompt)
    case 'ollama': return callOllama(config, systemPrompt, userPrompt)
    default: throw new Error(`Unknown provider: ${config.provider}`)
  }
}

async function callOpenAI(config: ProviderConfig, system: string, user: string): Promise<LLMResponse> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.7, max_tokens: 600,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return {
    content: data.choices[0].message.content,
    tokens: { input: data.usage?.prompt_tokens ?? 0, output: data.usage?.completion_tokens ?? 0 },
  }
}

async function callAnthropic(config: ProviderConfig, system: string, user: string): Promise<LLMResponse> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model, system,
      messages: [{ role: 'user', content: user }],
      max_tokens: 600,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return {
    content: data.content[0].text,
    tokens: { input: data.usage?.input_tokens ?? 0, output: data.usage?.output_tokens ?? 0 },
  }
}

async function callGoogle(config: ProviderConfig, system: string, user: string): Promise<LLMResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
    }),
  })
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    tokens: { input: data.usageMetadata?.promptTokenCount ?? 0, output: data.usageMetadata?.candidatesTokenCount ?? 0 },
  }
}

async function callOllama(config: ProviderConfig, system: string, user: string): Promise<LLMResponse> {
  const base = config.baseUrl || 'http://localhost:11434'
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      stream: false,
    }),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return {
    content: data.message?.content ?? '',
    tokens: { input: data.prompt_eval_count ?? 0, output: data.eval_count ?? 0 },
  }
}
