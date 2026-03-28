import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import type { OmniNode, PulseResult } from '../../lib/omniverse/types'
import BreathingCloud from './BreathingCloud'

interface Props {
  data: PulseResult | null
  onSelectNode: (n: OmniNode | null) => void
  selectedNode: OmniNode | null
}

function flatten(nodes: OmniNode[]): OmniNode[] {
  const out: OmniNode[] = []
  function walk(ns: OmniNode[]) {
    for (const n of ns) { out.push(n); if (n.children.length > 0) walk(n.children) }
  }
  walk(nodes)
  return out
}

export default function Manifold({ data, onSelectNode, selectedNode }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const flatNodes = useMemo(() => data?.nodes ? flatten(data.nodes) : [], [data?.nodes])

  const coords = useMemo(() => {
    const raw = data?.umap_3d
    if (!raw || raw.length === 0) return []
    const c = raw.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
      .map(v => v / raw.length)
    const spread = 3.5
    return raw.map(p => [(p[0] - c[0]) * spread, (p[1] - c[1]) * spread, (p[2] - c[2]) * spread])
  }, [data?.umap_3d])

  return (
    <Canvas camera={{ position: [3, 2, 3], fov: 60, near: 0.01, far: 100 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => onSelectNode(null)}
      style={{ background: '#08080e', width: '100%', height: '100%' }}>
      <color attach="background" args={['#08080e']} />
      <fog attach="fog" args={['#08080e', 3, 18]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 10, 4]} intensity={0.7} color="#f0ece6" />
      <directionalLight position={[-4, 6, -3]} intensity={0.2} color="#d0ccc6" />
      <pointLight position={[0, -4, 0]} intensity={0.08} color="#d4845a" />
      {coords.length > 0 && (
        <BreathingCloud coords={coords} flatNodes={flatNodes}
          onNodeClick={onSelectNode} selectedNode={selectedNode}
          hoveredId={hoveredId} onHover={setHoveredId} />
      )}
      <OrbitControls enableDamping dampingFactor={0.08} rotateSpeed={0.6}
        zoomSpeed={0.8} minDistance={0.3} maxDistance={30} enablePan panSpeed={0.5} />
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.3} luminanceSmoothing={0.8} mipmapBlur />
        <Vignette offset={0.3} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  )
}
