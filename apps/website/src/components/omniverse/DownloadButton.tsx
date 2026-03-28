import JSZip from 'jszip'

export default function DownloadButton() {
  async function handleDownload() {
    const zip = new JSZip()
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Omniverse — Semantic World-Model Compiler</title>
  <style>body { margin: 0; background: #08080e; color: #f0e9df; font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; }
  p { max-width: 500px; text-align: center; line-height: 1.7; opacity: 0.7; }</style>
</head>
<body>
  <p>To run Omniverse locally, serve this folder with any HTTP server:<br>
  <code>npx serve .</code> or <code>python3 -m http.server</code><br><br>
  For the full experience, visit <a href="https://motherlabs.ai/tools/omniverse" style="color:#c8762c">motherlabs.ai/tools/omniverse</a></p>
</body>
</html>`

    const readme = `# Omniverse — Semantic World-Model Compiler

A client-side tool for exploring semantic space through D×C×S expansion.

## Quick Start

1. Open https://motherlabs.ai/tools/omniverse in your browser
2. Enter your API key (OpenAI, Anthropic, Google, or Ollama)
3. Choose a model
4. Type an intent seed and click Pulse

## Local Use

Visit motherlabs.ai/tools/omniverse — it runs entirely in your browser.
Your API key never leaves your machine.

## Built by Motherlabs
https://motherlabs.ai
`

    zip.file('index.html', html)
    zip.file('README.md', readme)
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'omniverse-tool.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleDownload} style={{
      position: 'absolute', top: 12, right: 12, zIndex: 20,
      background: 'rgba(16, 15, 13, 0.9)', backdropFilter: 'blur(8px)',
      border: '1px solid #2e2921', borderRadius: 8,
      padding: '8px 14px', cursor: 'pointer',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
      fontWeight: 600, letterSpacing: 1, color: '#a89278',
      textTransform: 'uppercase',
    }}>
      ↓ Download
    </button>
  )
}
