import React from 'react'
import DialogBox from './DialogBox'
import SelectionKit from './SelectionKit'

interface FloatingKitProps {
  selection: string
}

function FloatingKit(props: FloatingKitProps) {
  const { selection } = props
  const [triggered, setTriggered] = React.useState(false)
  const [prompt, setPrompt] = React.useState()

  const handleCompletionRequest = React.useCallback((nextPrompt) => {
    setPrompt(nextPrompt)
    setTriggered(true)
  }, [])

  if (triggered) {
    return <DialogBox prompt={prompt} />
  }

  return <SelectionKit content={selection} onCompletionRequest={handleCompletionRequest} />
}

export default FloatingKit
