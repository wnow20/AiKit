import React from 'react'
import { getUserConfig, UserConfig } from '../config'

export default function useUserConfig() {
  const [userConfig, setUserConfig] = React.useState<UserConfig>()
  React.useEffect(() => {
    let cancelled = false
    getUserConfig().then((userConfig) => {
      !cancelled && setUserConfig(userConfig)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return userConfig
}
