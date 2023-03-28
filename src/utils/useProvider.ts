import React from 'react'
import Browser from 'webextension-polyfill'
import { getProviderConfigs, ProviderConfigs } from '../config'

export default function useAiProvider() {
  const [config, setConfig] = React.useState<ProviderConfigs>()
  React.useEffect(() => {
    let cancelled = false
    try {
      getProviderConfigs().then((pConfig) => {
        !cancelled && setConfig(pConfig)
      })
    } catch (e) {
      console.error(e)
    }
    const listener = async (message: any) => {
      console.debug('receive message in useAiProvider', message)
      if (message.type === 'ONCLICK_SWITCH_TO_AIKIT') {
        const providerConfigs = await getProviderConfigs()
        setConfig(providerConfigs)
      }
    }
    try {
      Browser.runtime.onMessage.addListener(listener)
    } catch (e) {
      console.error(e)
    }
    return () => {
      cancelled = true
      try {
        Browser.runtime.onMessage.removeListener(listener)
      } catch (e) {
        console.error(e)
      }
    }
  }, [])
  return config
}
