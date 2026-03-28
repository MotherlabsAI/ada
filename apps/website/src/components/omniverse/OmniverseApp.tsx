import { useState } from 'react'

export default function OmniverseApp() {
  const [ready, setReady] = useState(false)

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#100f0d', color: '#f0e9df',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <p style={{ opacity: 0.5 }}>Omniverse loading...</p>
    </div>
  )
}
