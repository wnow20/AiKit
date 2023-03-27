import { Conversation } from '../background/types'

export function isHistoryChatValid(
  historyConversation: Conversation,
): historyConversation is Conversation {
  return !!(
    (
      historyConversation.id &&
      historyConversation.qnaList &&
      historyConversation.createAt &&
      historyConversation.createAt - Date.now() < 86400000
    ) // 大于一天的聊天记录不要了
  )
}
