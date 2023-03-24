import React from 'react'
import Draggable from 'react-draggable'
import { v4 as uuidv4 } from 'uuid'
import Browser, { Runtime } from 'webextension-polyfill'
import { AiEvent } from '../background/types'
import { scrollToBottom } from '../domUtils'
import AvatarIcon from '../images/avatar.svg'
import OpenAIIcon from '../images/openai.svg'
import RefreshIcon from '../images/refresh.svg'
import SendIcon from '../images/send.svg'
import useUpdateEffect from '../useUpdateEffect'
import { updateByAiEvent } from './converse'
import CursorBlock from './CursorBlock'
import './DialogBox.scss'
import QuestionTag from './QuestionTag'

interface DialogBoxProps {
  question?: Question
}

export type Role = 'user' | 'assistant'

export type AnswerStatus = 'not_started' | 'error' | 'progressing' | 'succeed'

export interface Message {
  id?: string
  role: Role
  qType?: QuestionType
  data: string
  status?: AnswerStatus
  error?: string
}

interface DialogItemProps {
  message: Message
}

export type QuestionType = 'translate' | 'summarize' | 'chat'

export interface Question {
  text: string
  type: QuestionType
  id: string
}

export interface Answer {
  text: string
  id: string
  status: AnswerStatus
  error?: string
}

export interface QnA {
  question: Question
  answer: Answer
}

export interface Conversation {
  id: string
  qnaList: QnA[]
}

function DialogItem(props: DialogItemProps) {
  const { message } = props

  return (
    <div className={`dialog-item ${message.role}`}>
      <div className="avatar-box">
        <div className="avatar">
          {message.role === 'assistant' ? <OpenAIIcon /> : <AvatarIcon />}
        </div>
      </div>
      <div className="dialog-content-wrapper">
        <div className="dialog-content">
          <QuestionTag type={message.qType} />
          {message.data}
          {message.status === 'progressing' ? <CursorBlock /> : null}
        </div>
      </div>
    </div>
  )
}

function newQnA(text: string): QnA {
  return {
    question: {
      id: uuidv4(),
      text,
      type: 'chat',
    },
    answer: {
      id: uuidv4(),
      text: '',
      status: 'progressing',
    },
  }
}

function DialogBox(props: DialogBoxProps) {
  const { question } = props
  const [conversation, setConversation] = React.useState<Conversation>()
  const portRef = React.useRef<Runtime.Port>()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [text, setText] = React.useState('')
  const [inputHeight, setInputHeight] = React.useState(24)
  const [isChat, setIsChat] = React.useState<boolean>(() => {
    return question == null || question?.type === 'chat'
  })

  React.useEffect(() => {
    if (question) {
      setConversation({
        id: uuidv4(),
        qnaList: [
          {
            question,
            answer: {
              id: uuidv4(),
              text: '',
              status: 'progressing',
            },
          },
        ],
      })
    }
  }, [question])

  React.useEffect(() => {
    if (!question) {
      return
    }
    const port = Browser.runtime.connect()
    portRef.current = port
    const listener = (msg: AiEvent) => {
      console.log('received answer', msg)
      setConversation((prev) => {
        return updateByAiEvent(prev, msg)
      })
    }
    port.onMessage.addListener(listener)
    console.log('postMessage', question)
    port.postMessage({ question })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [question])

  const handleInputChange = React.useCallback((e) => {
    setText(() => {
      return e.target.value
    })
  }, [])

  const handleKeyDown = React.useCallback(
    (e) => {
      if (e.which === 13 && e.shiftKey == true) {
        setInputHeight(e.target.value.split('\n').length * 24 + 24)
      }
      if (e.which === 8) {
        e.target.value.endsWith('\n') && setInputHeight((prev) => prev - 24)
      }
      if (e.keyCode == 13 && e.shiftKey == false) {
        e.preventDefault()
        submit(e.target.value, conversation!)
      }
    },
    [conversation],
  )

  function submit(inputText: string, conversation: Conversation) {
    if (!conversation || conversation.qnaList.length === 0) {
      return
    }
    const progressing = conversation.qnaList.find((x) => {
      return x.answer.status === 'progressing'
    })
    if (progressing) {
      return
    }

    const qnA = newQnA(inputText)
    setConversation((prevState): Conversation => {
      return {
        id: prevState?.id ?? uuidv4(),
        qnaList: [...(prevState?.qnaList ?? []), qnA],
      }
    })
    setTimeout(() => {
      scrollRef.current && scrollToBottom(scrollRef.current)
    }, 100)
    setTimeout(() => {
      portRef.current?.postMessage({
        question: qnA.question,
      })
    })
    setText('')
  }

  const handleSendClick = React.useCallback(
    (e) => {
      e.preventDefault()
      if (conversation && text) {
        submit(text, conversation)
      }
    },
    [conversation, text],
  )
  useUpdateEffect(() => {
    if (!conversation) {
      return
    }
    requestAnimationFrame(() => {
      scrollRef.current && scrollToBottom(scrollRef.current)
    })
  }, [conversation])

  const messages = React.useMemo(() => {
    const msgList: Message[] = []
    conversation?.qnaList.forEach((qna) => {
      msgList.push({
        status: 'succeed',
        role: 'user',
        data: qna.question.text,
        id: qna.question.id,
        qType: qna.question.type,
      })
      msgList.push({
        status: qna.answer.status,
        role: 'assistant',
        data: qna.answer.text,
        id: qna.answer.id,
        error: qna.answer.error,
      })
    })
    return msgList
  }, [conversation])

  const handleRegenerateClick = React.useCallback(() => {
    // TODO
  }, [])

  const height = isChat ? 450 : undefined

  const handleTriggerChatClick = React.useCallback(() => {
    setIsChat(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])
  return (
    <Draggable handle=".dialog-header">
      <div className="aikit-dialog-box" style={{ width: 400, height }}>
        <div className="dialog-header"></div>
        <div className="dialog-list" ref={scrollRef}>
          {messages.map((message, index) => (
            <DialogItem key={index} message={message} />
          ))}
          {messages.length && messages[messages.length - 1].error ? (
            <div className="dialog-list-tail">
              <button className="regenerate-btn" onClick={handleRegenerateClick}>
                <span className="btn-icon">
                  <RefreshIcon />
                </span>{' '}
                重新生成
              </button>
            </div>
          ) : null}
        </div>
        {isChat ? (
          <div className="message-input-wrapper">
            <textarea
              placeholder="CMD+回车发送"
              className="message-input"
              ref={inputRef}
              value={text}
              onKeyDownCapture={handleKeyDown}
              onChange={handleInputChange}
              style={{ maxHeight: '120px', height: `${inputHeight}px` }}
            ></textarea>
            <a role="button" className="send" onClick={handleSendClick}>
              <SendIcon />
            </a>
          </div>
        ) : (
          <div className="triggerChat" onClick={handleTriggerChatClick}>
            开始聊天
          </div>
        )}
      </div>
    </Draggable>
  )
}

export default DialogBox
