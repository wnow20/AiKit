import ChatIcon from './chat.svg'
import SummarizeIcon from './summarize.svg'
import TranslateIcon from './translate.svg'

interface SelectionKitProps {
  content: string
}

export default function SelectionKit(props: SelectionKitProps) {
  const { content } = props
  return (
    <div className="selection-kit">
      <a role="button">
        <TranslateIcon />
      </a>
      <a role="button">
        <ChatIcon />
      </a>
      <a role="button">
        <SummarizeIcon />
      </a>
    </div>
  )
}
