import type { Conversation, Question } from './background/types'
import { Language } from './config'

function generateTranslatePrompt(content: string, language: Language) {
  return (
    `Translate the following into ${language} and only show me the translated content.` +
    `If it is already in ${language},` +
    `translate it into English and only show me the translated content:\n"${content}"`
  )
}

function generateSummarizePrompt(content: string, language: Language) {
  return `Reply in ${language}.Summarize the following as concisely as possible:\n"${content}"`
}

function generateChatPrompt(content: string, language: Language) {
  return `Reply in ${language}.Analyze the following content and express your opinion,or give your answer:\n"${content}"`
}

export default function convertPrompt(question: Question, language: Language): string {
  if (question.type === 'translate') {
    return generateTranslatePrompt(question.text, language)
  } else if (question.type === 'summarize') {
    return generateSummarizePrompt(question.text, language)
  } else if (question.type === 'chat') {
    return generateChatPrompt(question.text, language)
  } else {
    const type: never = question.type
    // type check
    return type
  }
}

function decorateQuestion(question: Question, language: Language): Question {
  return {
    ...question,
    text: convertPrompt(question, language),
  }
}

export function decorateConversation(conversation: Conversation, language: Language): Conversation {
  if (!conversation.qnaList) {
    return conversation
  }

  return {
    ...conversation,
    qnaList: conversation.qnaList.map((qna) => {
      return {
        ...qna,
        question: decorateQuestion(qna.question, language),
      }
    }),
  }
}
