import { OldAnswer } from '../messaging'

export type AiEvent =
  | {
      event: 'answer' | 'done'
      data: OldAnswer
    }
  | {
      error: string
      data: {
        questionId: string
      }
    }

export type StreamEvent =
  | {
      event: 'done'
    }
  | {
      event: 'answer'
      data: OldAnswer
    }

export interface GenerateAnswerParams {
  prompt: string
  onEvent: (event: StreamEvent) => void
  signal?: AbortSignal
}

export interface Provider {
  generateAnswer(params: GenerateAnswerParams): Promise<{ cleanup?: () => void }>
}
