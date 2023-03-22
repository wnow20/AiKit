import React from 'react'
import Draggable from 'react-draggable'
import Browser from 'webextension-polyfill'
import AvatarIcon from './avatar.svg'
import './DialogBox.scss'
import OpenAIIcon from './openai.svg'
import SendIcon from './send.svg'

interface DialogBoxProps {
  prompt?: string
}

interface Message {
  id?: string
  role: string
  data: string
  status?: 'not_started' | 'error' | 'progressing' | 'succeed'
  error?: string
}

interface DialogItemProps {
  message: Message
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
        <div className="dialog-content">{message.data}</div>
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
  const { prompt } = props
  const [text, setText] = React.useState('')
  const [inputHeight, setInputHeight] = React.useState(24)
  const [messages, setMessages] = React.useState<Message[]>([])

  React.useEffect(() => {
    if (!prompt) {
      return
    }
    setMessages([
      {
        role: 'user',
        data: prompt,
        status: 'not_started',
      },
    ])
    const port = Browser.runtime.connect()
    const listener = (msg: any) => {
      console.log('received answer', msg)
      if (msg.text) {
        setMessages((prev) => {
          return updateByMsgId(prev, msg, (prevItem) => ({
            ...prevItem,
            data: msg.text,
            status: 'progressing',
          }))
        })
      } else if (msg.error) {
        setMessages((prev) => {
          return updateByMsgId(prev, msg, (prevItem) => ({
            ...prevItem,
            data: msg.text,
            status: 'error',
            error: msg.error,
          }))
        })
      } else if (msg.event === 'DONE') {
        setMessages((prev) => {
          return updateByMsgId(prev, msg, (prevItem) => ({
            ...prevItem,
            status: 'succeed',
          }))
        })
      }
    }
    port.onMessage.addListener(listener)
    console.log('postMessage', prompt)
    port.postMessage({ question: prompt })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [prompt])

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
          <a role="button" className="send">
            <SendIcon />
          </a>
        </div>
      </div>
    </Draggable>
  )
}

export default DialogBox
