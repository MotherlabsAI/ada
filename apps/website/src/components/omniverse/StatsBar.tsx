import type { PulseResult } from '../../lib/omniverse/types'

interface Props { data: PulseResult | null; running: boolean }

export default function StatsBar({ data, running }: Props) {
  if (!data && !running) return null
  const s = {
    bar: { position: 'absolute' as const, bottom: 0, left: 280, right: 0,
      height: 36, background: 'rgba(16, 15, 13, 0.9)', backdropFilter: 'blur(8px)',
      borderTop: '1px solid #2e2921', display: 'flex', alignItems: 'center',
      gap: 24, padding: '0 20px', fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, color: '#a89278', zIndex: 15 },
    val: { color: '#f0e9df', fontWeight: 600 as const },
    dim: { color: '#6b5643' },
  }
  if (running && !data) return <div style={s.bar}><span>Expanding...</span></div>
  const d = data!
  return (
    <div style={s.bar}>
      <span>Pulse <span style={s.val}>#{d.pulse}</span></span>
      <span>Nodes <span style={s.val}>{d.total_nodes}</span></span>
      <span>Alive <span style={s.val}>{d.surviving_nodes}</span></span>
      <span style={s.dim}>Pruned {d.pruned_nodes}</span>
      {d.topology && <span>Topology <span style={s.val}>H₀={d.topology.h0}</span> <span style={s.val}>H₁={d.topology.h1}</span></span>}
      <span style={{ marginLeft: 'auto' }}>
        Tokens <span style={s.val}>{(d.token_usage.input + d.token_usage.output).toLocaleString()}</span>
      </span>
    </div>
  )
}
