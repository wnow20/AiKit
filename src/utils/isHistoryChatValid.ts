import { Conversation } from '../background/types'

export function isHistoryChatValid(
  historyConversation: Conversation,
): historyConversation is Conversation {
  return !!(historyConversation.id && historyConversation.qnaList)
}
