import Browser from 'webextension-polyfill'
import apiProvider from '../apiProvider'
import { Question } from '../components/DialogBox'
import { getUserConfig } from '../config'
import convert2Prompt from '../promptConverter'
import { getChatGPTAccessToken, sendMessageFeedback } from './providers/chatgpt'
import { AiEvent } from './types'

async function generateAnswers(port: Browser.Runtime.Port, question: string | Question) {
  const provider = await apiProvider()
  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })
  let prompt: string
  let messageId = 'nil'
  let message = ''
  if (typeof question === 'string') {
    prompt = question
  } else {
    const userConfig = await getUserConfig()
    prompt = convert2Prompt(question, userConfig.language)
    messageId = question.id
  }

  const { cleanup } = await provider.generateAnswer({
    prompt,
    signal: controller.signal,
    onEvent(event) {
      console.log('onEvent', event)
      if (event.event === 'done') {
        const event: AiEvent = {
          event: 'done',
          data: {
            text: message,
            questionId: messageId,
            conversationId: '',
          },
        }
        port.postMessage(event)
        return
      }
      if (typeof question === 'string') {
        messageId = event.data.questionId
      }
      message = event.data.text
      port.postMessage({
        event: 'answer',
        data: {
          ...event.data,
          messageId,
        },
      })
    },
  })
}

Browser.runtime.onConnect.addListener((port) => {
  console.debug('connected')
  port.onMessage.addListener(async (msg: { question: Question }) => {
    console.debug('received msg', msg)
    try {
      await generateAnswers(port, msg.question)
    } catch (err: any) {
      console.error(err)
      port.postMessage({
        error: err.message,
        data: {
          questionId: msg.question.id,
        },
      })
    }
  })
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    const token = await getChatGPTAccessToken()
    await sendMessageFeedback(token, message.data)
  } else if (message.type === 'OPEN_OPTIONS_PAGE') {
    Browser.runtime.openOptionsPage()
  } else if (message.type === 'GET_ACCESS_TOKEN') {
    return getChatGPTAccessToken()
  }
})

Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Browser.runtime.openOptionsPage()
  }
})

Browser.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`)
})
