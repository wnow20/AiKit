import React from 'react'

import { v4 as uuidv4 } from 'uuid'
import ChatIcon from './chat.svg'
import { Question } from './DialogBox'
import SummarizeIcon from './summarize.svg'
import TranslateIcon from './translate.svg'

interface SelectionKitProps {
  content: string
  onCompletionRequest?: (question: Question) => void
}

export default function SelectionKit(props: SelectionKitProps) {
  const { content, onCompletionRequest } = props
  const handleTranslateClick = React.useCallback(() => {
    onCompletionRequest?.({
      type: 'translate',
      text: content,
      id: uuidv4(),
    })
  }, [content, onCompletionRequest])
  const handleSummarizeClick = React.useCallback(() => {
    onCompletionRequest?.({
      type: 'summarize',
      text: content,
      id: uuidv4(),
    })
  }, [content, onCompletionRequest])
  const handleChatClick = React.useCallback(() => {
    onCompletionRequest?.({
      type: 'chat',
      text: content,
      id: uuidv4(),
    })
  }, [content, onCompletionRequest])

  return (
    <div className="selection-kit">
      <a role="button" title="翻译" onClick={handleTranslateClick}>
        <TranslateIcon />
      </a>
      <a role="button" title="开始聊天" onClick={handleChatClick}>
        <ChatIcon />
      </a>
      <a role="button" title="概述" onClick={handleSummarizeClick}>
        <SummarizeIcon />
      </a>
    </div>
  )
}
