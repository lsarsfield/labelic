import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './theme.css'
import { redo, undo, useLabel } from './state/store'
import { useViewport } from './state/viewport'
import { exportArtworkSvg, extractEmbeddedProject } from './io/exportSvg'
import { exportDraftPng } from './io/exportDraftPng'
import { exportWovenPng } from './io/exportWovenPng'
import { loadProjectFile } from './io/project'
import { uploadSvg } from './io/svgAssets'
import * as workspace from './io/workspace'
import { presetBlank, TEMPLATES } from './model/presets'
import { LAYOUTS } from './model/layouts'
import { parseDoc } from './model/serialize'
import { lastWeaveTimings } from './render/WeaveStage'
import { gridChecksum } from './weave/grid'
import { sampleDoc } from './weave/sample'

// Dev-only console access for debugging and scripted verification.
if (import.meta.env.DEV) {
  Object.assign(window as unknown as Record<string, unknown>, {
    __labelic: {
      useLabel,
      useViewport,
      undo,
      redo,
      exportArtworkSvg,
      exportWovenPng,
      exportDraftPng,
      extractEmbeddedProject,
      parseDoc,
      loadProjectFile,
      uploadSvg,
      workspace,
      presets: { presetBlank },
      templates: TEMPLATES,
      layouts: LAYOUTS,
      debug: {
        sampleDoc,
        gridChecksum,
        weaveTimings: () => ({ ...lastWeaveTimings }),
      },
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
