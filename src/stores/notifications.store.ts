import { create } from 'zustand'
import type { Notificacao } from '@/types'

interface NotificacaoStore {
  notificacoes: Notificacao[]
  naoLidas: number
  setNotificacoes:   (notificacoes: Notificacao[]) => void
  addNotificacao:    (notificacao: Notificacao) => void
  marcarLida:        (id: string) => void
  marcarTodasLidas:  () => void
}

export const useNotificacaoStore = create<NotificacaoStore>((set) => ({
  notificacoes: [],
  naoLidas: 0,

  setNotificacoes: (notificacoes) =>
    set({
      notificacoes,
      naoLidas: notificacoes.filter(n => !n.lida).length,
    }),

  addNotificacao: (notificacao) =>
    set((state) => ({
      notificacoes: [notificacao, ...state.notificacoes],
      naoLidas: notificacao.lida ? state.naoLidas : state.naoLidas + 1,
    })),

  marcarLida: (id) =>
    set((state) => ({
      notificacoes: state.notificacoes.map(n =>
        n.id === id ? { ...n, lida: true } : n
      ),
      naoLidas: Math.max(0, state.naoLidas - 1),
    })),

  marcarTodasLidas: () =>
    set((state) => ({
      notificacoes: state.notificacoes.map(n => ({ ...n, lida: true })),
      naoLidas: 0,
    })),
}))