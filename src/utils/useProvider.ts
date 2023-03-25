import React from 'react'
import { getProviderConfigs, ProviderConfigs } from '../config'

export default function useAiProvider() {
  const [config, setConfig] = React.useState<ProviderConfigs>()
  React.useEffect(() => {
    let cancelled = false
    getProviderConfigs().then((pConfig) => {
      !cancelled && setConfig(pConfig)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return config
}
