import { Conversation, QnA } from '../background/types'

export function getLatestQnA(conversation: Conversation | undefined) {
  let latestQnA: QnA | null = null
  const qnAList = conversation?.qnaList
  if (qnAList && qnAList.length) {
    latestQnA = qnAList[qnAList.length - 1]
  }
  return latestQnA
}
