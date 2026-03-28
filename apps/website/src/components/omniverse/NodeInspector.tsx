import type { OmniNode } from '../../lib/omniverse/types'
import { getColor, getShort } from '../../lib/omniverse/colors'

interface Props { node: OmniNode | null; onClose: () => void }

export default function NodeInspector({ node, onClose }: Props) {
  if (!node) return null
  const color = getColor(node.domain)
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, width: 300,
      background: 'rgba(16, 15, 13, 0.95)', backdropFilter: 'blur(12px)',
      border: `1px solid ${color}30`, borderRadius: 10, padding: 16, zIndex: 20,
      color: '#f0e9df', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          fontWeight: 700, letterSpacing: 1.5, color, textTransform: 'uppercase' }}>
          {getShort(node.domain)} — {node.domain}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none',
          color: '#6b5643', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: '#dcd8d0', margin: 0 }}>{node.content}</p>
      <div style={{ marginTop: 12, display: 'flex', gap: 16,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b5643' }}>
        <span>depth={node.depth}</span>
        <span>score={node.score.toFixed(3)}</span>
        <span>cx={node.complexity.toFixed(2)}</span>
        <span style={{ color: node.alive ? '#5c9a72' : '#b85858' }}>
          {node.alive ? 'alive' : 'pruned'}
        </span>
      </div>
    </div>
  )
}
