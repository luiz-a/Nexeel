'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useNotificacaoStore } from '@/stores/notifications.store'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Notificacao, Profile } from '@/types'

interface Props {
  profile: Profile
  notificacoesIniciais: Notificacao[]
}

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',     emoji: '📊' },
  { href: '/agendamentos', label: 'Agendamentos',  emoji: '📋' },
  { href: '/usuarios',     label: 'Usuários',      emoji: '👥' },
  { href: '/carrinhos',    label: 'Carrinhos',     emoji: '🛒' },
  { href: '/locais',       label: 'Locais',        emoji: '📍' },
]

const TIPO_EMOJI: Record<string, string> = {
  agendamento: '📅',
  login:       '👤',
  cancelamento:'❌',
}

export function AdminHeader({ profile, notificacoesIniciais }: Props) {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const [sinoAberto, setSinoAberto] = useState(false)
  const sinoRef = useRef<HTMLDivElement>(null)

  const { notificacoes, naoLidas, setNotificacoes, addNotificacao, marcarLida, marcarTodasLidas } =
    useNotificacaoStore()

  // Inicializar store com dados do servidor
  useEffect(() => {
    setNotificacoes(notificacoesIniciais)
  }, [])

  // Realtime: escutar novas notificações
  useEffect(() => {
    const channel = supabase
      .channel('admin:notificacoes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        async (payload) => {
          console.log('REALTIME recebido:', payload)
          const { data } = await supabase
            .from('notificacoes')
            .select('*, profiles(full_name)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            addNotificacao(data)

            // Notificação nativa do browser
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.titulo, {
                body: data.mensagem,
                icon: '/favicon.ico',
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('REALTIME status:', status)
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Pedir permissão para notificações nativas
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Fechar sino ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sinoRef.current && !sinoRef.current.contains(e.target as Node)) {
        setSinoAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarcarLida = async (id: string) => {
    marcarLida(id)
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
  }

  const handleMarcarTodas = async () => {
    marcarTodasLidas()
    await supabase.from('notificacoes').update({ lida: true }).eq('lida', false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-4 flex-shrink-0">
          <span className="text-xl">🛒</span>
          <span className="font-bold text-white hidden sm:block">Cartinho</span>
        </Link>

        {/* Navegação */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                ${pathname.startsWith(item.href)
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="hidden md:block">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sino + avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Sino de notificações */}
          <div ref={sinoRef} className="relative">
            <button
              onClick={() => setSinoAberto(!sinoAberto)}
              className="relative p-2 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <span className="text-lg">🔔</span>
              {naoLidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1
                                 rounded-full bg-amber-500 text-black text-[10px] font-bold
                                 flex items-center justify-center">
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

            {/* Dropdown de notificações */}
            {sinoAberto && (
              <div className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-800
                              rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <h3 className="font-semibold text-sm">Notificações</h3>
                  {naoLidas > 0 && (
                    <button
                      onClick={handleMarcarTodas}
                      className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <p className="py-8 text-center text-zinc-500 text-sm">
                      Nenhuma notificação
                    </p>
                  ) : (
                    notificacoes.map(n => (
                      <div
                        key={n.id}
                        onClick={() => !n.lida && handleMarcarLida(n.id)}
                        className={`px-4 py-3 border-b border-zinc-800/50 cursor-pointer
                                    hover:bg-zinc-800/50 transition-colors
                                    ${!n.lida ? 'bg-amber-950/20' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-base flex-shrink-0 mt-0.5">
                            {TIPO_EMOJI[n.tipo]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{n.titulo}</p>
                              {!n.lida && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                              {n.mensagem}
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-1">
                              {formatDistanceToNow(parseISO(n.created_at), {
                                addSuffix: true, locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar + logout */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30
                            flex items-center justify-center text-amber-400 font-bold text-xs">
              {profile.full_name[0].toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}