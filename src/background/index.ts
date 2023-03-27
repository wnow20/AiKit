import Browser from 'webextension-polyfill'
import apiProvider from '../apiProvider'
import { getProviderConfigs, getUserConfig, ProviderType, saveProviderConfigs } from '../config'
import convert2Prompt, { decorateConversation } from '../promptConverter'
import { getLatestQnA } from '../utils/getLatestQnA'
import { getChatGPTAccessToken, sendMessageFeedback } from './providers/chatgpt'
import type { AiEvent, Conversation, Question } from './types'

async function generateAnswers(port: Browser.Runtime.Port, question: string | Question) {
  const provider = await apiProvider()
  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })
  let prompt: string
  let questionId = 'nil'
  let message = ''
  if (typeof question === 'string') {
    prompt = question
  } else {
    const userConfig = await getUserConfig()
    prompt = convert2Prompt(question, userConfig.language)
    questionId = question.id
  }

  const { cleanup } = await provider.generateAnswer({
    prompt,
    signal: controller.signal,
    onEvent(event) {
      console.debug('onEvent', event)
      if (event.event === 'done') {
        const event: AiEvent = {
          event: 'done',
          data: {
            text: message,
            questionId: questionId,
            conversationId: '',
          },
        }
        port.postMessage(event)
        return
      }
      if (typeof question === 'string') {
        questionId = event.data.questionId
      }
      message = event.data.text
      const aiEvent = {
        event: 'answer',
        data: {
          ...event.data,
          questionId: questionId,
        },
      } as AiEvent
      port.postMessage(aiEvent)
    },
  })
}

async function chatCompletion(port: Browser.Runtime.Port, conversation: Conversation) {
  const provider = await apiProvider()
  const latestQnA = getLatestQnA(conversation)
  if (!latestQnA) {
    return
  }
  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })
  let message = ''
  const userConfig = await getUserConfig()
  const decoratedConversation = decorateConversation(conversation, userConfig.language)

  const { cleanup } = await provider.chatCompletion({
    conversation: decoratedConversation,
    signal: controller.signal,
    onEvent(event) {
      console.debug('chatCompletion onEvent', event)
      if (event.event === 'done') {
        const event: AiEvent = {
          event: 'done',
          data: {
            text: message,
            questionId: latestQnA.question.id,
            conversationId: conversation.id,
          },
        }
        port.postMessage(event)
        return
      }
      message = event.data.text
      const aiEvent = {
        event: 'answer',
        data: {
          ...event.data,
          questionId: latestQnA.question.id,
          conversationId: conversation.id,
        },
      } as AiEvent
      port.postMessage(aiEvent)
    },
  })
}

Browser.runtime.onConnect.addListener((port) => {
  console.debug('connected')
  port.onMessage.addListener(
    async (msg: { question: Question } | { conversation: Conversation }) => {
      console.debug('received msg', msg)
      if ('question' in msg) {
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
      }

      if ('conversation' in msg) {
        try {
          await chatCompletion(port, msg.conversation)
        } catch (err: any) {
          console.error(err)
          port.postMessage({
            error: err.message,
            data: {
              questionId: getLatestQnA(msg.conversation)?.question.id,
            },
          })
        }
      }
    },
  )
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    const token = await getChatGPTAccessToken()
    await sendMessageFeedback(token, message.data)
  } else if (message.type === 'OPEN_OPTIONS_PAGE') {
    Browser.runtime.openOptionsPage()
  } else if (message.type === 'GET_ACCESS_TOKEN') {
    return getChatGPTAccessToken()
  } else if (message.type === 'ONCLICK_SWITCH_TO_AIKIT') {
    const providerConfigs = await getProviderConfigs()
    await saveProviderConfigs(ProviderType.AiKit, providerConfigs.configs)
  }
})

Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Browser.runtime.openOptionsPage()
  }
})

Browser.commands.onCommand.addListener((command) => {
  console.debug(`Command: ${command}`)
})
