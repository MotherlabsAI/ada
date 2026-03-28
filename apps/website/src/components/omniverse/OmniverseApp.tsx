import { useState, useCallback } from 'react'
import type { ProviderConfig, EngineConfig, OmniNode, PulseResult } from '../../lib/omniverse/types'
import { runPulse } from '../../lib/omniverse/primitives'
import ConfigPanel from './ConfigPanel'
import Manifold from './Manifold'
import StatsBar from './StatsBar'
import NodeInspector from './NodeInspector'
import DownloadButton from './DownloadButton'

export default function OmniverseApp() {
  const [pulseCount, setPulseCount] = useState(0)
  const [running, setRunning] = useState(false)
  const [data, setData] = useState<PulseResult | null>(null)
  const [selectedNode, setSelectedNode] = useState<OmniNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePulse = useCallback(async (
    provider: ProviderConfig,
    engine: EngineConfig,
    seed: string,
  ) => {
    setRunning(true)
    setError(null)
    try {
      const result = await runPulse(seed, pulseCount + 1, {
        config: provider,
        maxDepth: engine.maxDepth,
        branchMode: engine.branchMode,
      })
      setData(result)
      setPulseCount(c => c + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Expansion failed')
    } finally {
      setRunning(false)
    }
  }, [pulseCount])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ConfigPanel onPulse={handlePulse} running={running} pulseCount={pulseCount} />

      <div style={{ position: 'absolute', left: 280, top: 0, right: 0, bottom: 36 }}>
        {data ? (
          <Manifold data={data} onSelectNode={setSelectedNode} selectedNode={selectedNode} />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: '#08080e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6b5643', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14,
          }}>
            {running ? 'Expanding semantic space...' : 'Enter a seed and pulse to begin'}
          </div>
        )}
      </div>

      <NodeInspector node={selectedNode} onClose={() => setSelectedNode(null)} />
      <StatsBar data={data} running={running} />
      <DownloadButton />

      {error && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(184, 88, 88, 0.9)', color: '#f0e9df',
          padding: '8px 16px', borderRadius: 8, fontSize: 12, zIndex: 30,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {error}
          <button onClick={() => setError(null)} style={{
            marginLeft: 12, background: 'none', border: 'none',
            color: '#f0e9df', cursor: 'pointer',
          }}>×</button>
        </div>
      )}
    </div>
  )
}
