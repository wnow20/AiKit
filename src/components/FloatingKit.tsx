import React from 'react'
import DialogBox from './DialogBox'
import SelectionKit from './SelectionKit'

interface FloatingKitProps {
  selection: string
}

function FloatingKit(props: FloatingKitProps) {
  const { selection } = props
  const [triggered, setTriggered] = React.useState(false)

  const handleCompletionRequest = React.useCallback(() => {
    setTriggered(true)
  }, [])

  if (triggered) {
    return <DialogBox />
  }

  return <SelectionKit content={selection} onCompletionRequest={handleCompletionRequest} />
}

export default FloatingKit
