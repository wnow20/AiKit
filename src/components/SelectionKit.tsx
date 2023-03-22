import React from 'react'
import { getUserConfig, Language } from '../config'
import ChatIcon from './chat.svg'
import SummarizeIcon from './summarize.svg'
import TranslateIcon from './translate.svg'

interface SelectionKitProps {
  content: string
  onCompletionRequest?: (prompt: string) => void
}

function generateTranslatePrompt(content: string, language: Language) {
  return (
    `Translate the following into ${language} and only show me the translated content.` +
    `If it is already in ${language},` +
    `translate it into English and only show me the translated content:\n"${content}"`
  )
}

function generateSummarizePrompt(content: string, language: Language) {
  return `Reply in ${language}.Summarize the following as concisely as possible:\n"${content}"`
}

function generateChatPrompt(content: string, language: Language) {
  return `Reply in ${language}.Analyze the following content and express your opinion,or give your answer:\n"${content}"`
}

export default function SelectionKit(props: SelectionKitProps) {
  const { content, onCompletionRequest } = props
  const handleTranslateClick = React.useCallback(() => {
    getUserConfig().then((userConfig) => {
      onCompletionRequest?.(generateTranslatePrompt(content, userConfig.language))
    })
  }, [content, onCompletionRequest])
  const handleSummarizeClick = React.useCallback(() => {
    getUserConfig().then((userConfig) => {
      onCompletionRequest?.(generateSummarizePrompt(content, userConfig.language))
    })
  }, [content, onCompletionRequest])
  const handleChatClick = React.useCallback(() => {
    getUserConfig().then((userConfig) => {
      onCompletionRequest?.(generateChatPrompt(content, userConfig.language))
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
