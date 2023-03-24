import { describe, expect, test } from '@jest/globals'
import * as uuid from 'uuid'
import type { AiEvent, Conversation } from '../background/types'
import { updateByAiEvent } from './converse'

describe('converse', () => {
  test('updateByQuestionId', () => {
    const answerId = uuid.v4()
    const prev: Conversation = {
      id: uuid.v4(),
      qnaList: [
        {
          question: {
            text: 'Integrating',
            type: 'translate',
            id: answerId,
          },
          answer: {
            text: '',
            status: 'progressing',
            id: uuid.v4(),
          },
        },
      ],
    }
    const msg: AiEvent = {
      event: 'answer',
      data: {
        text: '集成',
        questionId: answerId,
        conversationId: '',
      },
    }
    const result: Conversation | undefined = updateByAiEvent(prev, msg)

    expect(result?.qnaList.length).toBe(1)
    expect(result?.qnaList[0].answer.text).toBe('集成')
  })
})
