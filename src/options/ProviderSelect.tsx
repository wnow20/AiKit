import { Button, Input, Select, Spinner, Tabs, useInput, useToasts } from '@geist-ui/core'
import { FC, useCallback, useState } from 'react'
import useSWR from 'swr'
import { fetchExtensionConfigs } from '../api'
import { getProviderConfigs, ProviderConfigs, ProviderType, saveProviderConfigs } from '../config'

interface ConfigProps {
  config: ProviderConfigs
  models: string[]
}

async function loadModels(): Promise<string[]> {
  const configs = await fetchExtensionConfigs()
  return configs.openai_model_names
}

const ConfigPanel: FC<ConfigProps> = ({ config, models }) => {
  const [tab, setTab] = useState<ProviderType>(config.provider)
  const { bindings: apiKeyBindings } = useInput(config.configs[ProviderType.OpenAI]?.apiKey ?? '')
  const [model, setModel] = useState(config.configs[ProviderType.OpenAI]?.model ?? models[0])
  const { setToast } = useToasts()

  const save = useCallback(async () => {
    if (tab === ProviderType.OpenAI) {
      if (!apiKeyBindings.value) {
        alert('Please enter your OpenAI API key')
        return
      }
      if (!model || !models.includes(model)) {
        alert('Please select a valid model')
        return
      }
    }
    await saveProviderConfigs(tab, {
      [ProviderType.OpenAI]: {
        model,
        apiKey: apiKeyBindings.value,
      },
    })
    setToast({ text: 'Changes saved', type: 'success' })
  }, [apiKeyBindings.value, model, models, setToast, tab])

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={tab} onChange={(v) => setTab(v as ProviderType)}>
        <Tabs.Item label="AiKit接口" value={ProviderType.AiKit}>
          AiKit网络服务，稳定高速，免费3个月，
          <span className="font-semibold">按量收费</span>，详见
          <a
            href="https://www.yuque.com/wnow20/urfk3b/hu0ox2n4xx6fwp63"
            target="_blank"
            rel="noreferrer"
          >
            收费政策
          </a>
        </Tabs.Item>
        <Tabs.Item label="ChatGPT" value={ProviderType.ChatGPT}>
          ChatGPT网络服务，免费，需科学上网，网络不稳定
        </Tabs.Item>
        <Tabs.Item label="OpenAI接口" value={ProviderType.OpenAI}>
          <div className="flex flex-col gap-2">
            <span>
              OpenAI官方接口，需科学上网，网络不稳定，
              <span className="font-semibold">按量收费</span>
            </span>
            <div className="flex flex-row gap-2">
              <Select
                scale={2 / 3}
                value={model}
                onChange={(v) => setModel(v as string)}
                placeholder="model"
              >
                {models.map((m) => (
                  <Select.Option key={m} value={m}>
                    {m}
                  </Select.Option>
                ))}
              </Select>
              <Input htmlType="password" label="API key" scale={2 / 3} {...apiKeyBindings} />
            </div>
            <span className="italic text-xs">
              科学上网并访问
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
              >
                OpenAI账户中心
              </a>
              ，注册OpenAI
            </span>
          </div>
        </Tabs.Item>
      </Tabs>
      <Button scale={2 / 3} ghost style={{ width: 20 }} type="success" onClick={save}>
        保存
      </Button>
    </div>
  )
}

function ProviderSelect() {
  const query = useSWR('provider-configs', async () => {
    const [config, models] = await Promise.all([getProviderConfigs(), loadModels()])
    return { config, models }
  })
  if (query.isLoading) {
    return <Spinner />
  }
  return <ConfigPanel config={query.data!.config} models={query.data!.models} />
}

export default ProviderSelect
