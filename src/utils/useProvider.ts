import React from 'react'
import Browser from 'webextension-polyfill'
import { getProviderConfigs, ProviderConfigs } from '../config'

export default function useAiProvider() {
  const [config, setConfig] = React.useState<ProviderConfigs>()
  React.useEffect(() => {
    let cancelled = false
    getProviderConfigs().then((pConfig) => {
      !cancelled && setConfig(pConfig)
    })
    const listener = async (message: any) => {
      console.debug('receive message in useAiProvider', message)
      if (message.type === 'ONCLICK_SWITCH_TO_AIKIT') {
        const providerConfigs = await getProviderConfigs()
        setConfig(providerConfigs)
      }
    }
    Browser.runtime.onMessage.addListener(listener)
    return () => {
      cancelled = true
      Browser.runtime.onMessage.removeListener(listener)
    }
  }, [])
  return config
}
