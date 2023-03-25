import { GearIcon } from '@primer/octicons-react'
import { useCallback } from 'react'
import useSWR from 'swr'
import Browser from 'webextension-polyfill'
import '../base.css'
import DialogBox from '../components/DialogBox'
import { ProviderType } from '../config'
import logo from '../logo.png'
import useAiProvider from '../utils/useProvider'
import ChatGPTWebFrame from './ChatGPTWebFrame'
import './Popup.scss'

const isChrome = /chrome/i.test(navigator.userAgent)

const SHORTCUTS_TIP_KEY = 'hideShortcutsTip'

// Browser.storage.local.remove(SHORTCUTS_TIP_KEY)

function PopupHeader() {
  const openOptionsPage = useCallback(() => {
    Browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  }, [])

  return (
    <div className="mb-2 flex flex-row items-center px-1">
      <img src={logo} className="w-5 h-5 rounded-sm" />
      <p className="text-sm font-semibold m-0 ml-1">AiKit</p>
      <div className="grow"></div>
      <span className="cursor-pointer leading-[0]" onClick={openOptionsPage}>
        <GearIcon size={16} />
      </span>
    </div>
  )
}

function ShortCutsTip() {
  const hideShortcutsTipQuery = useSWR(SHORTCUTS_TIP_KEY, async () => {
    const { hideShortcutsTip } = await Browser.storage.local.get(SHORTCUTS_TIP_KEY)
    return !!hideShortcutsTip
  })

  const openShortcutsPage = useCallback(() => {
    Browser.storage.local.set({ hideShortcutsTip: true })
    Browser.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }, [])

  return (
    (isChrome && !hideShortcutsTipQuery.isLoading && !hideShortcutsTipQuery.data && (
      <p className="m-0 mb-2">
        提示:{' '}
        <a onClick={openShortcutsPage} className="underline cursor-pointer">
          设置快捷键
        </a>{' '}
        快速唤起该窗口.
      </p>
    )) ||
    null
  )
}

function Popup() {
  const aiProvider = useAiProvider()

  return (
    <div className="flex flex-col h-full">
      <PopupHeader />
      <ShortCutsTip />
      {aiProvider?.provider === ProviderType.ChatGPT ? <ChatGPTWebFrame /> : <DialogBox />}
    </div>
  )
}

export default Popup
