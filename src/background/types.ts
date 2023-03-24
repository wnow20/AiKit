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
