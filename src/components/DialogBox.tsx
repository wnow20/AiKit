import React from 'react'
import Draggable from 'react-draggable'
import { v4 as uuidv4 } from 'uuid'
import Browser from 'webextension-polyfill'
import { AiEvent } from '../background/types'
import AvatarIcon from './avatar.svg'
import { updateByAiEvent } from './converse'
import CursorBlock from './CursorBlock'
import './DialogBox.scss'
import OpenAIIcon from './openai.svg'
import QuestionTag from './QuestionTag'
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

function DialogBox(props: DialogBoxProps) {
  const { question } = props
  const [conversation, setConversation] = React.useState<Conversation>()

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
    // if (e.target.value) {
    //   setInputHeight(24 * e.target.value.split('\n').length);
    // }
  }, [])

  const handleKeyDown = React.useCallback((e) => {
    console.log(e.which)
    if (e.which === 13 && e.shiftKey == true) {
      setInputHeight(e.target.value.split('\n').length * 24 + 24)
    }
    if (e.which === 8) {
      e.target.value.endsWith('\n') && setInputHeight((prev) => prev - 24)
    }
    if (e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault()
      // submit()
    }
  }, [])

  const handleSendClick = React.useCallback((e) => {
    e.preventDefault()

    // submit();
  }, [])

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
      })
    })
    return msgList
  }, [conversation])

  console.log('messages')
  console.log(messages)
  console.log(conversation)

  return (
    <Draggable handle=".dialog-header">
      <div className="aikit-dialog-box" style={{ width: 400, height: 450 }}>
        <div className="dialog-header"></div>
        <div className="dialog-list">
          {messages.map((message, index) => (
            <DialogItem key={index} message={message} />
          ))}
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
