import { GearIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'preact/hooks'
import { memo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import Browser from 'webextension-polyfill'
import { captureEvent } from '../analytics'
import { AiEvent } from '../background/types'
import CursorBlock from '../components/CursorBlock'
import { getProviderName, ProviderType } from '../config'
import { OldAnswer } from '../messaging'
import useAiProvider from '../utils/useProvider'
import ChatGPTError from './ChatGPTError'
import ChatGPTFeedback from './ChatGPTFeedback'
import { shouldShowRatingTip } from './utils.js'

export type QueryStatus = 'success' | 'error' | undefined

interface Props {
  question: string
  onStatusChange?: (status: QueryStatus) => void
}

function ChatGPTQuery(props: Props) {
  const [answer, setAnswer] = useState<OldAnswer | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [done, setDone] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [status, setStatus] = useState<QueryStatus>()
  const aiProvider = useAiProvider()

  useEffect(() => {
    props.onStatusChange?.(status)
  }, [props, status])

  useEffect(() => {
    const port = Browser.runtime.connect()
    const listener = (msg: AiEvent) => {
      if ('text' in msg.data) {
        setAnswer(msg.data)
        setStatus('success')
      } else if ('error' in msg) {
        setError(msg.error)
        setStatus('error')
      } else if (msg.event === 'done') {
        setDone(true)
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: props.question })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [props.question, retry])

  // retry error on focus
  useEffect(() => {
    const onFocus = () => {
      if (error && (error == 'UNAUTHORIZED' || error === 'CLOUDFLARE')) {
        setError('')
        setRetry((r) => r + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [error])

  useEffect(() => {
    shouldShowRatingTip().then((show) => setShowTip(show))
  }, [])

  useEffect(() => {
    if (status === 'success') {
      captureEvent('show_answer', { host: location.host, language: navigator.language })
    }
  }, [props.question, status])

  const openOptionsPage = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  }, [])

  if (answer) {
    return (
      <div className="markdown-body gpt-markdown" id="gpt-answer" dir="auto">
        <div className="gpt-header">
          <span className="font-bold">{getProviderName(aiProvider?.provider)}</span>
          <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
            <GearIcon size={14} />
          </span>
          {aiProvider?.provider === ProviderType.ChatGPT ? (
            <ChatGPTFeedback
              messageId={answer.questionId}
              conversationId={answer.conversationId}
              answerText={answer.text}
            />
          ) : null}
        </div>
        <ReactMarkdown rehypePlugins={[[rehypeHighlight, { detect: true }]]}>
          {answer.text}
        </ReactMarkdown>
        {done && showTip && (
          <p className="italic mt-2">
            喜欢这个插件? 给个五星好评吧~ 去{' '}
            <a
              href="https://chatgpt4google.com/chrome?utm_source=rating_tip"
              target="_blank"
              rel="noreferrer"
            >
              Chrome Web Store
            </a>{' '}
            评价
          </p>
        )}
      </div>
    )
  }

  if (error) {
    return <ChatGPTError error={error} retry={retry} />
  }

  return (
    <div className="markdown-body gpt-markdown" id="gpt-answer" dir="auto">
      <div className="gpt-header">
        <span className="font-bold">{getProviderName(aiProvider?.provider)}</span>
        <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
          <GearIcon size={14} />
        </span>
      </div>
      <div>
        <CursorBlock />
      </div>
    </div>
  )
}

export default memo(ChatGPTQuery)
