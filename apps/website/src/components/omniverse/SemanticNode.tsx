import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { OmniNode } from '../../lib/omniverse/types'
import { getColor, getShort } from '../../lib/omniverse/colors'

const NODE_RADIUS = 0.04

interface Props {
  position: number[]
  node: OmniNode
  onClick: (n: OmniNode) => void
  selected: boolean
  hovered: boolean
  onHover: (id: string | null) => void
}

export default function SemanticNode({ position, node, onClick, selected, hovered, onHover }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const color = getColor(node.domain)
  const label = getShort(node.domain)
  const isActive = selected || hovered

  const h2 = useMemo(() => {
    if (!node.content) return ''
    const c = node.content
    const quoted = c.match(/"([^"]{4,40})"/)?.[1]
    if (quoted) return quoted
    const dashed = c.match(/[–—]\s*(.{4,40})/)?.[1]
    if (dashed) { const cut = dashed.lastIndexOf(' '); return cut > 8 ? dashed.slice(0, cut) : dashed }
    const stripped = c.replace(/^(To |The |A |An |This |We |In order to )\w.{0,60}?,\s*/i, '')
    const raw = stripped.slice(0, 35)
    const cut = raw.lastIndexOf(' ')
    return cut > 8 ? raw.slice(0, cut) : raw
  }, [node.content])

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return
    const t = state.clock.elapsedTime
    const camDist = state.camera.position.distanceTo(groupRef.current.position)
    const distScale = Math.max(0.6, Math.min(3.0, camDist / 4))
    const breathe = 1 + Math.sin(t * 0.8 + node.complexity * 3) * 0.03
    const s = NODE_RADIUS * breathe * distScale * (isActive ? 2.0 : 1)
    meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1)
  })

  return (
    <group ref={groupRef} position={position as [number, number, number]}>
      <mesh ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(node) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node.id) }}
        onPointerOut={() => onHover(null)}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial
          color={node.alive ? color : '#1a1a1a'}
          emissive={color}
          emissiveIntensity={selected ? 1.4 : hovered ? 0.9 : 0.35}
          roughness={0.55} metalness={0.15} />
      </mesh>

      <Html position={[0, NODE_RADIUS * 2.5 + 0.02, 0]} center occlude={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 1, opacity: !node.alive ? 0.3 : isActive ? 1 : 0.7, transition: 'opacity 0.2s ease' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
            letterSpacing: 1.5, color, textTransform: 'uppercase', whiteSpace: 'nowrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{label}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, fontWeight: 400,
            lineHeight: 1.3, color: node.alive ? '#9a9590' : '#5a5550',
            textAlign: 'center', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>{h2}</div>
        </div>
      </Html>

      {selected && (
        <Html position={[0, NODE_RADIUS * 5 + 0.06, 0]} center
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, lineHeight: 1.6,
            color: '#dcd8d0', textAlign: 'center', maxWidth: 280,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
            background: 'rgba(10, 10, 15, 0.92)', backdropFilter: 'blur(16px)',
            padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${color}30`, boxShadow: `0 0 12px ${color}15` }}>
            {node.content?.slice(0, 250)}
          </div>
        </Html>
      )}
    </group>
  )
}
