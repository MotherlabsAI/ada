import { useState, useEffect } from 'react'
import type { ProviderConfig, EngineConfig } from '../../lib/omniverse/types'
import { PROVIDER_PRESETS } from '../../lib/omniverse/types'

interface Props {
  onPulse: (provider: ProviderConfig, engine: EngineConfig, seed: string) => void
  running: boolean
  pulseCount: number
}

const STORAGE_KEY = 'omniverse-config'

function loadSaved(): Partial<ProviderConfig> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  catch { return {} }
}

function saveConfig(cfg: Partial<ProviderConfig>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

export default function ConfigPanel({ onPulse, running, pulseCount }: Props) {
  const [provider, setProvider] = useState<ProviderConfig['provider']>(() => {
    const saved = loadSaved()
    return (saved.provider as ProviderConfig['provider']) ?? 'openai'
  })
  const [model, setModel] = useState(() => {
    const saved = loadSaved()
    return saved.model ?? PROVIDER_PRESETS.openai.default
  })
  const [apiKey, setApiKey] = useState(() => loadSaved().apiKey ?? '')
  const [seed, setSeed] = useState('')
  const [maxDepth, setMaxDepth] = useState(2)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => { saveConfig({ provider, model, apiKey }) }, [provider, model, apiKey])

  function handleProviderChange(next: ProviderConfig['provider']) {
    const preset = PROVIDER_PRESETS[next]
    if (preset && !preset.models.includes(model)) setModel(preset.default)
    setProvider(next)
  }

  const canPulse = apiKey.length > 0 && seed.trim().length > 0 && !running

  function handlePulse() {
    if (!canPulse) return
    onPulse(
      { provider, model, apiKey, baseUrl: provider === 'ollama' ? 'http://localhost:11434' : undefined },
      { engine: 'primitive', maxDepth, branchMode: 'fixed', prunePct: 0.3 },
      seed,
    )
  }

  const s = {
    panel: {
      position: 'absolute' as const, left: 0, top: 0, bottom: 0,
      width: collapsed ? 40 : 280,
      background: 'rgba(16, 15, 13, 0.95)', backdropFilter: 'blur(12px)',
      borderRight: '1px solid #2e2921', zIndex: 20,
      display: 'flex', flexDirection: 'column' as const,
      transition: 'width 0.2s ease', overflow: 'hidden',
    },
    toggle: {
      position: 'absolute' as const, right: -12, top: 12,
      width: 24, height: 24, borderRadius: 12,
      background: '#211e19', border: '1px solid #2e2921',
      color: '#a89278', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, zIndex: 21,
    },
    body: {
      padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 12,
      opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s ease',
      overflow: 'auto', flex: 1,
    },
    label: {
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
      fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const,
      color: '#a89278', marginBottom: 4,
    },
    input: {
      width: '100%', padding: '6px 8px', borderRadius: 6,
      background: '#181612', border: '1px solid #2e2921',
      color: '#f0e9df', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', outline: 'none',
    },
    select: {
      width: '100%', padding: '6px 8px', borderRadius: 6,
      background: '#181612', border: '1px solid #2e2921',
      color: '#f0e9df', fontSize: 13, cursor: 'pointer',
    },
    button: {
      width: '100%', padding: '10px 16px', borderRadius: 8,
      background: canPulse ? '#c8762c' : '#2e2921',
      color: canPulse ? '#100f0d' : '#6b5643',
      fontSize: 13, fontWeight: 700, cursor: canPulse ? 'pointer' : 'default',
      border: 'none', letterSpacing: 0.5, transition: 'background 0.15s ease',
    },
  }

  return (
    <div style={s.panel}>
      <button style={s.toggle} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '›' : '‹'}
      </button>
      {!collapsed && (
        <div style={s.body}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0e9df', marginBottom: 8 }}>
            Omniverse
          </div>

          <div>
            <div style={s.label}>Provider</div>
            <select style={s.select} value={provider}
              onChange={e => handleProviderChange(e.target.value as ProviderConfig['provider'])}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="ollama">Ollama (local)</option>
            </select>
          </div>

          <div>
            <div style={s.label}>Model</div>
            {PROVIDER_PRESETS[provider]?.models.length > 0 ? (
              <select style={s.select} value={model} onChange={e => setModel(e.target.value)}>
                {PROVIDER_PRESETS[provider].models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input style={s.input} value={model} onChange={e => setModel(e.target.value)}
                placeholder="model name" />
            )}
          </div>

          <div>
            <div style={s.label}>API Key</div>
            <input style={s.input} type="password" value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={provider === 'ollama' ? 'not needed' : 'sk-...'} />
            <div style={{ fontSize: 9, color: '#6b5643', marginTop: 3 }}>
              Stored in your browser only. Never sent to motherlabs.
            </div>
          </div>

          <div>
            <div style={s.label}>Depth (1-4)</div>
            <input style={{ ...s.input, width: 60 }} type="number" min={1} max={4}
              value={maxDepth}
              onChange={e => setMaxDepth(Math.min(4, Math.max(1, parseInt(e.target.value) || 2)))} />
          </div>

          <div>
            <div style={s.label}>Intent Seed</div>
            <textarea style={{ ...s.input, resize: 'vertical', minHeight: 60 }}
              value={seed} onChange={e => setSeed(e.target.value)}
              placeholder="Describe a concept to expand..." />
          </div>

          <button style={s.button} onClick={handlePulse} disabled={!canPulse}>
            {running ? 'Expanding...' : `Pulse ${pulseCount > 0 ? `#${pulseCount + 1}` : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
