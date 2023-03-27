import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'
import { ASSISTANT_GREETING, extractMessages } from './provider-common'
import { ChatCompletionParams, ChatCompletionResponse } from './provider-types'

const API_HOST =
  'http://nginx.web-framework-p8cg.1109595215468882.cn-hongkong.fc.devsapp.net/openai'

export class AiKitProvider implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildPrompt(prompt: string): string {
    if (this.model.startsWith('text-chat-davinci')) {
      return `Respond conversationally.<|im_end|>\n\nUser: ${prompt}<|im_sep|>\nChatGPT:`
    }
    return prompt
  }

  async chatCompletion(params: ChatCompletionParams) {
    let result = ''
    const messages = extractMessages(params.conversation)
    messages.unshift({ role: 'assistant', content: ASSISTANT_GREETING })
    await fetchSSE(API_HOST + '/v1/chat/completions', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        messages,
        model: 'gpt-3.5-turbo-0301',
        stream: true,
        max_tokens: 4000,
      }),
      onMessage: (message) => {
        console.debug('aikit provider receive message', message)
        if (message === '[DONE]') {
          params.onEvent({ event: 'done' })
          return
        }
        let data: ChatCompletionResponse
        try {
          data = JSON.parse(message)
          const text = data.choices[0].delta.content
          if (text == null) {
            return
          }
          result += text
          params.onEvent({
            event: 'answer',
            data: {
              text: result,
              questionId: data.id,
              conversationId: data.id,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''
    await fetchSSE(API_HOST + '/v1/completions', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: this.model,
        prompt: this.buildPrompt(params.prompt),
        stream: true,
        max_tokens: 2048,
      }),
      onMessage(message) {
        console.debug('sse message', message)
        if (message === '[DONE]') {
          params.onEvent({ event: 'done' })
          return
        }
        let data
        try {
          data = JSON.parse(message)
          const text = data.choices[0].text
          if (text === '<|im_end|>' || text === '<|im_sep|>') {
            return
          }
          result += text
          params.onEvent({
            event: 'answer',
            data: {
              text: result,
              questionId: data.id,
              conversationId: data.id,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
