import { useEffect, useState } from 'preact/hooks'
import React from 'react'
import Draggable, { ControlPosition, DraggableData, DraggableEvent } from 'react-draggable'
import { v4 as uuidv4 } from 'uuid'
import Browser, { Runtime } from 'webextension-polyfill'
import type { AiEvent, Conversation, Message, QnA, Question } from '../background/types'
import { ProviderType } from '../config'
import ChatGPTError from '../content-script/ChatGPTError'
import { elementBoundCheck, scrollToBottom } from '../domUtils'
import AvatarIcon from '../images/avatar.svg'
import OpenAIIcon from '../images/openai.svg'
import RefreshIcon from '../images/refresh.svg'
import SendIcon from '../images/send.svg'
import useUpdateEffect from '../useUpdateEffect'
import { getLatestQnA } from '../utils/getLatestQnA'
import { buildChat, getInitChat } from '../utils/initChat'
import useAiProvider from '../utils/useProvider'
import { updateByAiEvent } from './converse'
import CursorBlock from './CursorBlock'
import './DialogBox.scss'
import OpenAIError from './OpenAIError'
import QuestionTag from './QuestionTag'
import useBrowserAPIProbe from './useBrowserAPIProbe'

interface DialogBoxProps {
  question?: Question
  persistent?: boolean
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
        <div className="dialog-content">
          <QuestionTag type={message.qType} />
          {message.data}
          {message.status === 'progressing' || message.status === 'not_started' ? (
            <CursorBlock />
          ) : null}
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
      status: 'not_started',
    },
  }
}

function DialogBox(props: DialogBoxProps) {
  const { question, persistent } = props
  const [conversation, setConversation] = React.useState<Conversation>()
  const portRef = React.useRef<Runtime.Port>()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [text, setText] = React.useState('')
  const [inputHeight, setInputHeight] = React.useState(24)
  const [isChat, setIsChat] = React.useState<boolean>(() => {
    return question == null || question?.type === 'chat'
  })
  const [retry, setRetry] = useState(0)
  const aiProvider = useAiProvider()
  const dialogBoxRef = React.useRef<HTMLDivElement>(null)
  const { error: probeError, probeApi } = useBrowserAPIProbe()

  React.useEffect(() => {
    buildChat(question, persistent).then((chat) => {
      setConversation(chat)
    })
  }, [persistent, question])

  React.useEffect(() => {
    let port: Runtime.Port
    try {
      port = Browser.runtime.connect()
      portRef.current = port
    } catch (e: any) {
      console.error(e)
      return
    }
    const listener = (msg: AiEvent) => {
      console.debug('received answer', msg)
      setConversation((prev) => {
        return updateByAiEvent(prev, msg)
      })
    }
    try {
      port.onMessage.addListener(listener)
    } catch (e) {
      console.error(e)
    }
    return () => {
      try {
        port.onMessage.removeListener(listener)
        port.disconnect()
      } catch (e) {
        console.error(e)
      }
      portRef.current = undefined
      console.debug('browser port disconnected')
    }
  }, [])

  React.useEffect(() => {
    const latestQnA = getLatestQnA(conversation)
    if (persistent && latestQnA && latestQnA.answer.status === 'succeed') {
      console.debug('PERSIST_CHAT event sent')
      Browser.runtime
        .sendMessage({
          type: 'PERSIST_CHAT',
          chat: conversation,
        })
        .catch((e) => {
          console.error(e)
        })
    }
  }, [conversation, persistent])

  React.useEffect(() => {
    const port = portRef.current
    if (!port) {
      console.debug('browser port not exist.')
      return
    }

    const latestQnA = getLatestQnA(conversation)
    if (latestQnA?.answer.status === 'not_started') {
      try {
        console.debug('before postMessage')
        port.postMessage({
          conversation,
          persistent,
        })
        console.debug('after postMessage')
      } catch (e) {
        const err = e as Error
        if ('message' in err && err.message.includes('Extension context invalidated')) {
          setConversation((prev) => {
            const errorMsg: AiEvent = {
              error: '插件已更新，请刷新网页或重开窗口',
              data: {
                questionId: latestQnA.question.id,
              },
            }
            return updateByAiEvent(prev, errorMsg)
          })
        }
        console.error(e)
      }
    }
  }, [conversation, persistent])

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

  const sendRetry = React.useCallback(() => {
    const latestQA = getLatestQnA(conversation)
    if (!conversation || !latestQA || !latestQA.answer.error) {
      return
    }
    setConversation({
      ...conversation,
      qnaList: [
        ...conversation.qnaList.slice(0, conversation.qnaList.length - 1),
        {
          ...latestQA,
          answer: {
            ...latestQA.answer,
            error: '',
            status: 'not_started',
          },
        },
      ],
    })
    setRetry((r) => r + 1)
  }, [conversation])

  const handleCleanChat = React.useCallback(() => {
    const latestQA = getLatestQnA(conversation)
    if (!conversation || !latestQA || !latestQA.answer.error) {
      return
    }
    setConversation({
      ...conversation,
      qnaList: [
        {
          ...latestQA,
          answer: {
            ...latestQA.answer,
            error: '',
            status: 'not_started',
          },
        },
      ],
    })
    setRetry((r) => r + 1)
  }, [conversation])

  function submit(inputText: string, conversation: Conversation | null) {
    if (!conversation) {
      return
    }
    const qnA = newQnA(inputText)
    if (conversation.qnaList.length === 0) {
      setConversation({
        ...conversation,
        qnaList: [qnA],
      })
    } else {
      const progressing = conversation.qnaList.find((x) => {
        return x.answer.status === 'progressing'
      })
      if (progressing) {
        return
      }

      setConversation((prevState): Conversation => {
        return {
          ...getInitChat(),
          ...prevState,
          qnaList: [...(prevState?.qnaList ?? []), qnA],
        }
      })
    }
    setTimeout(() => {
      scrollRef.current && scrollToBottom(scrollRef.current)
    }, 100)
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
    conversation?.qnaList?.forEach((qna) => {
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

  const handleTriggerChatClick = React.useCallback(() => {
    setIsChat(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [])

  const error = React.useMemo(() => {
    const qnaList = conversation?.qnaList
    if (!qnaList || !qnaList.length) {
      return
    }
    return qnaList[qnaList.length - 1].answer.error
  }, [conversation])

  // retry error on focus
  useEffect(() => {
    const onFocus = () => {
      probeApi()
      if (error && (error == 'UNAUTHORIZED' || error === 'CLOUDFLARE')) {
        sendRetry()
      }
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [error, probeApi, sendRetry])

  const [position, setPosition] = React.useState<ControlPosition>()
  React.useEffect(() => {
    const result = elementBoundCheck(dialogBoxRef?.current)
    result && setPosition(result)
  }, [])

  const handDragStop = React.useCallback((e: DraggableEvent, data: DraggableData) => {
    setPosition(data)
  }, [])
  return (
    <Draggable handle=".dialog-header" position={position} onStop={handDragStop}>
      <div className="aikit-dialog-box" ref={dialogBoxRef} style={{ width: 400, maxHeight: 450 }}>
        <div className="dialog-header"></div>
        <div className="dialog-list" ref={scrollRef}>
          {messages.map((message, index) => (
            <DialogItem key={index} message={message} />
          ))}
          {error && !probeError ? (
            <div className="dialog-list-tail">
              {aiProvider?.provider === ProviderType.ChatGPT ? (
                <ChatGPTError error={error} retry={retry} />
              ) : null}
              {aiProvider?.provider !== ProviderType.ChatGPT ? (
                <div>
                  <OpenAIError messages={messages} error={error} onCleanChat={handleCleanChat} />
                  <button className="regenerate-btn" onClick={sendRetry}>
                    <span className="btn-icon">
                      <RefreshIcon />
                    </span>
                    &nbsp;重新生成
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {probeError ? <div className="dialog-list-tail">{probeError.message}</div> : null}
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
              autoFocus={true}
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
