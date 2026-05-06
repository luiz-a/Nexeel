'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePushNotification(userId: string | undefined) {
  const [permitido, setPermitido] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return
    // Verificar se já tem permissão
    if ('Notification' in window) {
      setPermitido(Notification.permission === 'granted')
    }
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [userId])

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const ativarPush = async () => {
    if (!userId || !('serviceWorker' in navigator)) return
    setCarregando(true)

    try {
      // Pedir permissão
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setCarregando(false)
        return
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.ready

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const sub = subscription.toJSON()

      // Salvar no banco
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth,
        }),
      })

      setPermitido(true)
    } catch (err) {
      console.error('Erro ao ativar push:', err)
    } finally {
      setCarregando(false)
    }
  }

  return { permitido, carregando, ativarPush }
}