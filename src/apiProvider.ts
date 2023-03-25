import { AiKitProvider } from './background/providers/aikit'
import { ChatGPTProvider, getChatGPTAccessToken } from './background/providers/chatgpt'
import { OpenAIProvider } from './background/providers/openai'
import { Provider } from './background/types'
import { getProviderConfigs, ProviderType } from './config'

export default async function apiProvider(): Promise<Provider> {
  const providerConfigs = await getProviderConfigs()

  if (providerConfigs.provider === ProviderType.ChatGPT) {
    const token = await getChatGPTAccessToken()
    return new ChatGPTProvider(token)
  } else if (providerConfigs.provider === ProviderType.OpenAI) {
    const { apiKey, model } = providerConfigs.configs[ProviderType.OpenAI]!
    return new OpenAIProvider(apiKey, model)
  } else if (providerConfigs.provider === ProviderType.AiKit) {
    const apiKey = window.atob(
      'c2stbm5Qb3dQMHR4dHRUODhmZWxUbUFUM0JsYmtGSjZNcjdSZVBrTHE3eE1hYmNHRUhs',
    )
    return new AiKitProvider(apiKey, 'text-davinci-003')
  } else {
    throw new Error(`Unknown provider ${providerConfigs.provider}`)
  }
}
