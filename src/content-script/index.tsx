import { render } from 'preact'
import '../base.css'
import FloatingKit from '../components/FloatingKit'
import { getUserConfig, Language, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ChatGPTContainer from './ChatGPTContainer'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils'

async function mount(question: string, siteConfig: SearchEngine) {
  const container = document.createElement('div')
  container.className = 'aikit-search-container'

  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  render(
    <ChatGPTContainer question={question} triggerMode={userConfig.triggerMode || 'always'} />,
    container,
  )
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const matchArray = location.hostname.match(siteRegex)
let siteName: string | null = null
let siteConfig: SearchEngine | null = null
if (matchArray) {
  siteName = matchArray[0]
  siteConfig = config[siteName]
}

let aikitContentContainer: HTMLDivElement | null = null

function createContainer(position: { x: number; y: number }) {
  const element = document.createElement('div')
  element.style.position = 'fixed'
  element.style.zIndex = '99999'
  element.style.left = position.x + 'px'
  element.style.top = position.y + 'px'
  element.classList.add('aikit-container')
  document.documentElement.appendChild(element)
  return element
}

function getContainer(e: MouseEvent) {
  const position = { x: e.clientX - 60, y: e.clientY - 55 }
  if (aikitContentContainer) {
    aikitContentContainer.style.left = position.x + 'px'
    aikitContentContainer.style.top = position.y + 'px'
  }
  return aikitContentContainer || createContainer(position)
}

function initializeSelectionKit() {
  console.debug('initializeSelectionKit')
  document.addEventListener('mouseup', (e) => {
    if (aikitContentContainer && aikitContentContainer.contains(e.target as Node)) {
      return
    }
    const selection = window.getSelection()
    if (!selection) {
      return
    }
    // if (aikitContentContainer
    //   && (selection?.rangeCount ?? 0) > 0
    //   && aikitContentContainer.contains(selection?.getRangeAt(0).endContainer.parentElement)) {
    //   return;
    // }

    requestAnimationFrame(() => {
      const selectedContent = selection.toString()
      if (!selectedContent) {
        return
      }
      aikitContentContainer = getContainer(e)

      render(<FloatingKit selection={selectedContent} />, aikitContentContainer)
    })
  })
  document.addEventListener('mousedown', (e) => {
    if (aikitContentContainer && aikitContentContainer.contains(e.target as Node)) return

    aikitContentContainer?.remove()
    aikitContentContainer = null
  })
}

async function run() {
  if (siteConfig) {
    const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
    if (searchInput && searchInput.value) {
      console.debug('Mount ChatGPT on', siteName)
      const userConfig = await getUserConfig()
      const searchValueWithLanguageOption =
        userConfig.language === Language.Auto
          ? searchInput.value
          : `${searchInput.value}(in ${userConfig.language})`
      mount(searchValueWithLanguageOption, siteConfig)
    }
  }
  initializeSelectionKit()
}

run()

if (siteConfig && siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
