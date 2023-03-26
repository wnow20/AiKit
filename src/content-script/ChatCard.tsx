import { LightBulbIcon, SearchIcon } from '@primer/octicons-react'
import { useState } from 'preact/hooks'
import { getProviderName, TriggerMode } from '../config'
import useAiProvider from '../utils/useProvider'
import ChatGPTQuery, { QueryStatus } from './ChatGPTQuery'
import { endsWithQuestionMark } from './utils.js'

interface Props {
  question: string
  triggerMode: TriggerMode
  onStatusChange?: (status: QueryStatus) => void
}

function ChatCard(props: Props) {
  const [triggered, setTriggered] = useState(false)
  const aiProvider = useAiProvider()
  const providerName = getProviderName(aiProvider?.provider)

  if (props.triggerMode === TriggerMode.Always) {
    return <ChatGPTQuery question={props.question} onStatusChange={props.onStatusChange} />
  }
  if (props.triggerMode === TriggerMode.QuestionMark) {
    if (endsWithQuestionMark(props.question.trim())) {
      return <ChatGPTQuery question={props.question} onStatusChange={props.onStatusChange} />
    }
    return (
      <p className="icon-and-text">
        <LightBulbIcon size="small" /> Trigger {providerName} by appending a question mark after
        your query
      </p>
    )
  }
  if (triggered) {
    return <ChatGPTQuery question={props.question} onStatusChange={props.onStatusChange} />
  }
  return (
    <p className="icon-and-text cursor-pointer" onClick={() => setTriggered(true)}>
      <SearchIcon size="small" /> Ask {providerName} for this query
    </p>
  )
}

export default ChatCard
