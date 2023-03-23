import { AiEvent } from '../background/types'
import { Conversation, QnA } from './DialogBox'

export function updateByAiEvent(
  prev: Conversation | undefined,
  msg: AiEvent,
): Conversation | undefined {
  if (prev == null) {
    return prev
  }
  const qnaList = prev?.qnaList
  if (qnaList == null) {
    return prev
  }

  const index = qnaList.findIndex((x) => {
    return x.question.id === msg.data.questionId
  })
  if (index === -1) {
    return prev
  }
  const prevItem = qnaList[index]

  let nextItem: QnA
  if ('event' in msg) {
    if (msg.event === 'done') {
      nextItem = {
        ...prevItem,
        answer: {
          ...prevItem.answer,
          text: msg.data.text,
          status: 'succeed',
        },
      }
    } else {
      nextItem = {
        ...prevItem,
        answer: {
          ...prevItem.answer,
          text: msg.data.text,
          status: 'progressing',
        },
      }
    }
  } else {
    nextItem = {
      ...prevItem,
      answer: {
        ...prevItem.answer,
        error: msg.error,
        status: 'error',
      },
    }
  }

  return {
    ...prev,
    qnaList: [...qnaList.slice(0, index), nextItem, ...qnaList.slice(index + 1)],
  }
}
