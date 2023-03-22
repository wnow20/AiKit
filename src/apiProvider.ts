import { ChatGPTProvider, getChatGPTAccessToken } from './background/providers/chatgpt'
import { OpenAIProvider } from './background/providers/openai'
import { Provider } from './background/types'
import { getProviderConfigs, ProviderType } from './config'

export default async function apiProvider(): Promise<Provider> {
  const providerConfigs = await getProviderConfigs()

  if (providerConfigs.provider === ProviderType.ChatGPT) {
    const token = await getChatGPTAccessToken()
    return new ChatGPTProvider(token)
  } else if (providerConfigs.provider === ProviderType.GPT3) {
    const { apiKey, model } = providerConfigs.configs[ProviderType.GPT3]!
    return new OpenAIProvider(apiKey, model)
  } else {
    throw new Error(`Unknown provider ${providerConfigs.provider}`)
  }
}
