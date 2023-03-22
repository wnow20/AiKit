import React from 'react'
import Draggable from 'react-draggable'
import AvatarIcon from './avatar.svg'
import './DialogBox.scss'
import OpenAIIcon from './openai.svg'
import SendIcon from './send.svg'

interface DialogBoxProps {
  prompt?: string
}

interface Message {
  role: string
  data: string
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

function generateDataSource(): Message[] {
  return [
    {
      role: 'user',
      data: '翻译',
    },
    {
      role: 'assistant',
      data: '翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译',
    },
    {
      role: 'user',
      data: '翻译',
    },
    {
      role: 'assistant',
      data: '翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译',
    },
    {
      role: 'user',
      data: '翻译',
    },
    {
      role: 'assistant',
      data: '翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译',
    },
    {
      role: 'user',
      data: '翻译',
    },
    {
      role: 'assistant',
      data: '翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译翻译',
    },
  ]
}

function DialogBox(props: DialogBoxProps) {
  const messages = generateDataSource()
  const [prompt, setPrompt] = React.useState('')
  const [inputHeight, setInputHeight] = React.useState(24)

  const handleInputChange = React.useCallback((e) => {
    setPrompt(() => {
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
            value={prompt}
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
