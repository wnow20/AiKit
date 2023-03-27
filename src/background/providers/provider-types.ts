import { Conversation, Role, StreamEvent } from '../types'

export interface ChatMessage {
  role: Role
  content: string
}
export interface ChatChoiceDelta {
  content: string
}

export interface ChatChoice {
  delta: ChatChoiceDelta
  finish_reason: string
  index: number
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  choices: ChatChoice[]
}

export interface ChatCompletionParams {
  conversation: Conversation
  signal?: AbortSignal
  onEvent: (event: StreamEvent) => void
}
