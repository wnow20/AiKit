import { GlobeIcon } from '@primer/octicons-react'
import useSWR from 'swr'
import Browser from 'webextension-polyfill'

export default function ChatGPTWebFrame() {
  const accessTokenQuery = useSWR(
    'accessToken',
    () => Browser.runtime.sendMessage({ type: 'GET_ACCESS_TOKEN' }),
    { shouldRetryOnError: false },
  )

  if (accessTokenQuery.isLoading) {
    return (
      <div className="grow justify-center items-center flex animate-bounce">
        <GlobeIcon size={24} />
      </div>
    )
  }
  if (accessTokenQuery.data) {
    return <iframe src="https://chat.openai.com" className="grow border-none" />
  }
  return (
    <div className="grow flex flex-col justify-center">
      <p className="text-base px-2 text-center">
        请登录ChatGPT并通过真人验证&nbsp;
        <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
          chat.openai.com
        </a>
      </p>
    </div>
  )
}
