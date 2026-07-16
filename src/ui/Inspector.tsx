import type { Layer } from '../model/types'
import { LAYER_TYPE_LABELS } from '../model/types'
import { useLabel } from '../state/store'
import { useSelectedLayer } from '../state/selectors'
import { ThreadRow } from './controls/ThreadRow'
import { BorderPanel } from './panels/BorderPanel'
import { DocPanel } from './panels/DocPanel'
import { MotifPanel } from './panels/MotifPanel'
import { RepeatRowPanel } from './panels/RepeatRowPanel'
import { TextLinePanel } from './panels/TextLinePanel'

export function Inspector() {
  const layer = useSelectedLayer()
  return (
    <div className="panel inspector-panel">
      <div className="panel-header">
        <span className="panel-title">{layer ? LAYER_TYPE_LABELS[layer.type] : 'Label'}</span>
      </div>
      <div className="inspector-body">{layer ? <LayerInspector layer={layer} /> : <DocPanel />}</div>
    </div>
  )
}

function LayerInspector({ layer }: { layer: Layer }) {
  const updateLayer = useLabel((s) => s.updateLayer)
  return (
    <>
      <div className="field-group">
        <ThreadRow value={layer.weftIndex} onChange={(weftIndex) => updateLayer(layer.id, { weftIndex })} />
      </div>
      <TypePanel layer={layer} />
    </>
  )
}

function TypePanel({ layer }: { layer: Layer }) {
  switch (layer.type) {
    case 'textLine':
      return <TextLinePanel layer={layer} />
    case 'motif':
      return <MotifPanel layer={layer} />
    case 'border':
      return <BorderPanel layer={layer} />
    case 'repeatRow':
      return <RepeatRowPanel layer={layer} />
  }
}
