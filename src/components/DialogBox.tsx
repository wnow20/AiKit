import React from 'react'
import Draggable from 'react-draggable'
import { v4 as uuidv4 } from 'uuid'
import Browser, { Runtime } from 'webextension-polyfill'
import { AiEvent } from '../background/types'
import AvatarIcon from './avatar.svg'
import { updateByAiEvent } from './converse'
import CursorBlock from './CursorBlock'
import './DialogBox.scss'
import OpenAIIcon from './openai.svg'
import QuestionTag from './QuestionTag'
import RefreshIcon from './refresh.svg'
import SendIcon from './send.svg'

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

function updateByMsgId(
  prev: Message[],
  msg: any,
  updator: (prevItem: Message) => Message,
): Message[] {
  const index = prev.findIndex((x) => msg.messageId === x.id)
  if (index === -1) {
    return [
      ...prev,
      updator({
        id: msg.messageId,
        data: msg.text,
        role: 'assistant',
      }),
    ]
  }
  const prevItem = prev[index]
  return [...prev.slice(0, index), updator(prevItem), ...prev.slice(index + 1)]
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
  const [text, setText] = React.useState('')
  const [inputHeight, setInputHeight] = React.useState(24)

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
      console.log(e.which)
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

  return (
    <Draggable handle=".dialog-header">
      <div className="aikit-dialog-box" style={{ width: 400, height: 450 }}>
        <div className="dialog-header"></div>
        <div className="dialog-list">
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
        <div className="message-input-wrapper">
          <textarea
            placeholder="CMD+回车发送"
            className="message-input"
            value={text}
            onKeyDownCapture={handleKeyDown}
            onChange={handleInputChange}
            style={{ maxHeight: '120px', height: `${inputHeight}px` }}
          ></textarea>
          <a role="button" className="send" onClick={handleSendClick}>
            <SendIcon />
          </a>
        </div>
      </div>
    </Draggable>
  )
}

export default DialogBox
