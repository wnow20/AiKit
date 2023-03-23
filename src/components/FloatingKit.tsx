import React from 'react'
import DialogBox, { Question } from './DialogBox'
import SelectionKit from './SelectionKit'

interface FloatingKitProps {
  selection: string
}

function FloatingKit(props: FloatingKitProps) {
  const { selection } = props
  const [triggered, setTriggered] = React.useState(false)
  const [question, setQuestion] = React.useState<Question>()

  const handleCompletionRequest = React.useCallback((nextPrompt) => {
    setQuestion(nextPrompt)
    setTriggered(true)
  }, [])

  if (triggered) {
    return <DialogBox question={question} />
  }

  return <SelectionKit content={selection} onCompletionRequest={handleCompletionRequest} />
}

export default FloatingKit
