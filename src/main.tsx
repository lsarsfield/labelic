import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './theme.css'
import { redo, undo, useLabel } from './state/store'
import { useViewport } from './state/viewport'
import { exportArtworkSvg, extractEmbeddedProject } from './io/exportSvg'
import { loadProjectFile } from './io/project'
import * as workspace from './io/workspace'
import { presetBlank, TEMPLATES } from './model/presets'
import { parseDoc } from './model/serialize'

// Dev-only console access for debugging and scripted verification.
if (import.meta.env.DEV) {
  Object.assign(window as unknown as Record<string, unknown>, {
    __labelic: {
      useLabel,
      useViewport,
      undo,
      redo,
      exportArtworkSvg,
      extractEmbeddedProject,
      parseDoc,
      loadProjectFile,
      workspace,
      presets: { presetBlank },
      templates: TEMPLATES,
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
