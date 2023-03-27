import { v4 as uuidv4 } from 'uuid'
import { Conversation, Question } from '../background/types'
import { getHistoryChat } from '../config'
import { isHistoryChatValid } from './isHistoryChatValid'

export function getInitChat(): Conversation {
  return {
    id: uuidv4(),
    qnaList: [],
    createAt: Date.now(),
  }
}

function persistedChatOrDefault(persistent: boolean | undefined) {
  if (persistent) {
    return getHistoryChat()
      .then((msg) => {
        console.debug('historyChat loaded.', msg.chat)
        const defaultChat = getInitChat()
        return isHistoryChatValid(msg.chat) ? { ...defaultChat, ...msg.chat } : defaultChat
      })
      .catch(() => {
        return getInitChat()
      })
  } else {
    return Promise.resolve(getInitChat())
  }
}

export async function buildChat(
  question: Question | undefined,
  persistent: boolean | undefined,
): Promise<Conversation> {
  const promise = persistedChatOrDefault(persistent)
  promise.then((historyChat) => {
    if (question) {
      historyChat.qnaList.push({
        question,
        answer: {
          id: uuidv4(),
          text: '',
          status: 'not_started',
        },
      })
    }
    return historyChat
  })
  return promise
}
