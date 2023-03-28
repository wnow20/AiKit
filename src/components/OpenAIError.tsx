import { MouseEvent } from 'react'
import { Message } from '../background/types'

interface OpenAIErrorProps {
  error: string
  messages: Message[]
  onCleanChat: (e: MouseEvent<HTMLAnchorElement>) => void
}

function OpenAIError(props: OpenAIErrorProps) {
  const { error, messages, onCleanChat } = props
  if (error.startsWith('{')) {
    const errorObj = JSON.parse(error) as {
      error: { message: string; type: string; param: string; code: string }
    }
    if (errorObj?.error?.code === 'context_length_exceeded') {
      return (
        <p>
          {errorObj.error.message}
          {error.includes('context_length_exceeded') ? (
            <a href="#" className="btn-icon" onClick={onCleanChat}>
              消息过多，清理历史记录
            </a>
          ) : null}
        </p>
      )
    }
  }
  return (
    <p>
      {error}{' '}
      {messages.length > 20 ? (
        <a href="#" className="btn-icon" onClick={onCleanChat}>
          消息过多，清理历史记录
        </a>
      ) : null}
    </p>
  )
}

export default OpenAIError
