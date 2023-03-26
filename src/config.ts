import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'

export enum TriggerMode {
  Always = 'always',
  QuestionMark = 'questionMark',
  Manually = 'manually',
}

export const TRIGGER_MODE_TEXT = {
  [TriggerMode.Always]: { title: '总是', desc: '每次搜索时总是发起AI询问' },
  [TriggerMode.QuestionMark]: {
    title: '问号结尾',
    desc: '在问号结尾的时候发起AI询问',
  },
  [TriggerMode.Manually]: {
    title: '手动',
    desc: '手动点击按钮是发起AI询问',
  },
}

export enum Theme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export const THEME_TEXT = {
  [Theme.Auto]: '自动',
  [Theme.Light]: '亮',
  [Theme.Dark]: '暗',
}

export enum Language {
  Auto = 'auto',
  English = 'english',
  Chinese = 'chinese',
}

// TODO 多语言支持
export const LANG_TEXT: Record<string, string> = {
  [Language.Auto]: '自动',
  [Language.English]: '英语',
  [Language.Chinese]: '简体中文',
}

export enum ProviderType {
  ChatGPT = 'chatgpt',
  AiKit = 'aikit',
  OpenAI = 'gpt3',
}

export const defaultUserConfig = {
  triggerMode: TriggerMode.Always,
  theme: Theme.Auto,
  language: Language.Chinese,
}

export type UserConfig = typeof defaultUserConfig

export async function getUserConfig(): Promise<UserConfig> {
  const result = await Browser.storage.local.get(Object.keys(defaultUserConfig))
  return defaults(result, defaultUserConfig)
}

export async function updateUserConfig(updates: Partial<UserConfig>) {
  console.debug('update configs', updates)
  return Browser.storage.local.set(updates)
}

interface GPT3ProviderConfig {
  model: string
  apiKey: string
}

export interface ProviderConfigs {
  provider: ProviderType
  configs: {
    [ProviderType.OpenAI]: GPT3ProviderConfig | undefined
  }
}

export const Provider_TEXT = {
  [ProviderType.ChatGPT]: 'ChatGPT',
  [ProviderType.AiKit]: 'AiKit',
  [ProviderType.OpenAI]: 'OpenAI',
}

export function getProviderName(type: ProviderType | undefined) {
  if (!type) {
    return ''
  }
  return Provider_TEXT[type]
}

export async function getProviderConfigs(): Promise<ProviderConfigs> {
  const { provider = ProviderType.AiKit } = await Browser.storage.local.get('provider')
  const configKey = `provider:${ProviderType.OpenAI}`
  const result = await Browser.storage.local.get(configKey)
  return {
    provider,
    configs: {
      [ProviderType.OpenAI]: result[configKey],
    },
  }
}

export async function saveProviderConfigs(
  provider: ProviderType,
  configs: ProviderConfigs['configs'],
) {
  return Browser.storage.local.set({
    provider,
    [`provider:${ProviderType.OpenAI}`]: configs[ProviderType.OpenAI],
  })
}
