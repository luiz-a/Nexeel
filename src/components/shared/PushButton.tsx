'use client'

import { usePushNotification } from '@/hooks/usePushNotification'

interface Props {
  userId: string
}

export function PushButton({ userId }: Props) {
  const { permitido, carregando, ativarPush } = usePushNotification(userId)

  // Não mostrar se browser não suporta
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  if (permitido) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                      bg-green-950 border border-green-800 text-green-400 text-xs">
        <span>🔔</span>
        <span>Notificacoes ativas</span>
      </div>
    )
  }

  return (
    <button
      onClick={ativarPush}
      disabled={carregando}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                 bg-amber-950 border border-amber-800 text-amber-400 text-xs
                 hover:bg-amber-900 transition-all disabled:opacity-50"
    >
      <span>🔔</span>
      <span>{carregando ? 'Ativando...' : 'Ativar notificacoes'}</span>
    </button>
  )
}