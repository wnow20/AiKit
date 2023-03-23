import { QuestionType } from './DialogBox'
import './QuestionTag.scss'

interface QuestionTagProps {
  type?: QuestionType
}

const nameMap: Record<Exclude<QuestionType, 'chat'>, string> = {
  translate: '翻译',
  summarize: '概述',
}

function QuestionTag(props: QuestionTagProps) {
  const { type } = props
  if (type == null || type === 'chat' || nameMap[type] == null) {
    return null
  }
  return <span className="question-tag">{nameMap[type]}</span>
}

export default QuestionTag
