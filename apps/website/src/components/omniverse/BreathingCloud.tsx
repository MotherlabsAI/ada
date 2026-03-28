import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import SemanticNode from './SemanticNode'
import type { OmniNode } from '../../lib/omniverse/types'

interface Props {
  coords: number[][]
  flatNodes: OmniNode[]
  onNodeClick: (n: OmniNode) => void
  selectedNode: OmniNode | null
  hoveredId: string | null
  onHover: (id: string | null) => void
}

export default function BreathingCloud({ coords, flatNodes, onNodeClick, selectedNode, hoveredId, onHover }: Props) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const camDist = state.camera.position.length()
    const scale = 0.5 + (camDist / 5) * 0.7
    const clamped = Math.max(0.4, Math.min(2.5, scale))
    groupRef.current.scale.lerp(new THREE.Vector3(clamped, clamped, clamped), 0.06)
  })

  return (
    <group ref={groupRef}>
      {coords.map((pos, i) => {
        if (i >= flatNodes.length) return null
        const node = flatNodes[i]
        return (
          <SemanticNode key={node.id} position={pos} node={node}
            onClick={onNodeClick} selected={selectedNode?.id === node.id}
            hovered={hoveredId === node.id} onHover={onHover} />
        )
      })}
    </group>
  )
}
