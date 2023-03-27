import { Conversation } from '../types'
import { ChatMessage } from './provider-types'

export const ASSISTANT_GREETING = `You are a helpful,\
 creative, clever, and very friendly assistant.\
 You are familiar with various languages in the world.`

export function extractMessages(conversation: Conversation): ChatMessage[] {
  if (!conversation?.qnaList) {
    return []
  }
  const messages: ChatMessage[] = []
  conversation.qnaList.forEach((qna) => {
    messages.push({
      role: 'user',
      content: qna.question.text,
    })
    messages.push({
      role: 'assistant',
      content: qna.answer.text,
    })
  })
  return messages
}
