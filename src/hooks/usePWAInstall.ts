'use client'

import { useEffect, useState } from 'react'

interface PWAInstallHook {
  podeInstalar: boolean       // Android: banner nativo disponível
  jaInstalado: boolean        // Já está rodando como PWA
  isIOS: boolean              // iPhone/iPad
  isAndroid: boolean          // Android
  instalar: () => Promise<void>
}

export function usePWAInstall(): PWAInstallHook {
  const [promptEvento, setPromptEvento] = useState<any>(null)
  const [jaInstalado, setJaInstalado]   = useState(false)
  const [isIOS, setIsIOS]               = useState(false)
  const [isAndroid, setIsAndroid]       = useState(false)

  useEffect(() => {
    // Detectar plataforma
    const ua = navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))
    setIsAndroid(/android/.test(ua))

    // Detectar se já está instalado (rodando como standalone)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setJaInstalado(standalone)

    // Capturar evento de instalação do Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvento(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const instalar = async () => {
    if (!promptEvento) return
    promptEvento.prompt()
    const { outcome } = await promptEvento.userChoice
    if (outcome === 'accepted') {
      setPromptEvento(null)
      setJaInstalado(true)
    }
  }

  return {
    podeInstalar: !!promptEvento,
    jaInstalado,
    isIOS,
    isAndroid,
    instalar,
  }
}