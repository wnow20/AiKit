import React, { Dispatch, SetStateAction } from 'react'
import Browser from 'webextension-polyfill'

type Error = {
  error: string
  message: string
}

interface APIProbe {
  error?: Error
  probeApi: () => void
}

const EXTENSION_CONTEXT_INVALIDATED = 'Extension context invalidated'

function handleException(e: any, setError: Dispatch<SetStateAction<Error | undefined>>) {
  if ('message' in e) {
    if (e.message.includes(EXTENSION_CONTEXT_INVALIDATED)) {
      setError({
        error: EXTENSION_CONTEXT_INVALIDATED,
        message: '插件已更新，请刷页面（因浏览器机制）',
      })
      return
    }
  }
  setError({
    error: 'unknown error',
    message: '' + e,
  })
}

function useBrowserAPIProbe(): APIProbe {
  const [error, setError] = React.useState<Error>()

  function probeAPIs() {
    try {
      Browser.storage.local.get('provider').catch((e) => {
        handleException(e, setError)
      })
    } catch (e) {
      handleException(e, setError)
    }
  }

  React.useEffect(() => {
    probeAPIs()
  }, [])

  const probeApi = React.useCallback(() => {
    probeAPIs()
  }, [])

  return {
    error,
    probeApi,
  }
}

export default useBrowserAPIProbe
