'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Agendamento } from '@/types'
import { TURNOS, STATUS_CONFIG } from '@/types'
import { AgendamentoCard } from './AgendamentoCard'

interface Props {
  pendentes: Agendamento[]
  agendamentosHoje: Agendamento[]
  totalUsuarios: number
  totalCarrinhos: number
}

export function DashboardClient({ pendentes: init, agendamentosHoje, totalUsuarios, totalCarrinhos }: Props) {
  const supabase = createClient()
  const [pendentes, setPendentes] = useState<Agendamento[]>(init)

  // Realtime: novos agendamentos pendentes
  useEffect(() => {
    const channel = supabase
      .channel('dashboard:agendamentos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agendamentos' },
        async (payload) => {
          const { data } = await supabase
            .from('agendamentos')
            .select('*, profiles(full_name, email), carrinhos(nome), locais(nome)')
            .eq('id', payload.new.id)
            .single()
          if (data) setPendentes(prev => [data, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'agendamentos' },
        (payload) => {
          if (payload.new.status !== 'pendente') {
            setPendentes(prev => prev.filter(a => a.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleAprovar = async (id: string, obs?: string) => {
    await supabase
      .from('agendamentos')
      .update({ status: 'aprovado', obs_admin: obs ?? null })
      .eq('id', id)
    setPendentes(prev => prev.filter(a => a.id !== id))
  }

  const handleRecusar = async (id: string, obs?: string) => {
    await supabase
      .from('agendamentos')
      .update({ status: 'recusado', obs_admin: obs ?? null })
      .eq('id', id)
    setPendentes(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-8">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Usuários ativos"     value={totalUsuarios}           cor="blue"   />
        <StatCard label="Carrinhos ativos"    value={totalCarrinhos}          cor="teal"   />
        <StatCard label="Agenda hoje"         value={agendamentosHoje.length} cor="green"  />
        <StatCard label="Pendentes"           value={pendentes.length}        cor="amber"  />
      </div>

      {/* Agenda de hoje */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-zinc-200">
          📅 Hoje —{' '}
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h2>
        {agendamentosHoje.length === 0 ? (
          <Vazio texto="Nenhum agendamento para hoje." />
        ) : (
          <div className="space-y-2">
            {agendamentosHoje.map(a => {
              const turno = TURNOS[a.turno]
              const status = STATUS_CONFIG[a.status]
              return (
                <div key={a.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-xl flex-shrink-0">{turno.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{(a as any).profiles?.full_name}</p>
                    <p className="text-sm text-zinc-400">
                      {(a as any).carrinhos?.nome} · {(a as any).locais?.nome}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-amber-400">{turno.label}</p>
                    <p className="text-xs text-zinc-500">{turno.inicio}–{turno.fim}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Pendentes */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-zinc-200">
          ⏳ Solicitações pendentes
          {pendentes.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-bold">
              {pendentes.length}
            </span>
          )}
        </h2>
        {pendentes.length === 0 ? (
          <Vazio texto="Nenhuma solicitação pendente. ✅" />
        ) : (
          <div className="space-y-4">
            {pendentes.map(a => (
              <AgendamentoCard
                key={a.id}
                agendamento={a}
                onAprovar={handleAprovar}
                onRecusar={handleRecusar}
              />
            ))}
          </div>
        )}
      </section>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/agendamentos', emoji: '📋', label: 'Agendamentos' },
          { href: '/usuarios',     emoji: '👥', label: 'Usuários'     },
          { href: '/carrinhos',    emoji: '🛒', label: 'Carrinhos'    },
          { href: '/locais',       emoji: '📍', label: 'Locais'       },
        ].map(item => (
          <a key={item.href} href={item.href}
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-800
                       hover:border-zinc-600 transition-all text-center">
            <p className="text-2xl mb-1">{item.emoji}</p>
            <p className="text-sm font-medium">{item.label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, cor }: { label: string; value: number; cor: string }) {
  const cores: Record<string, string> = {
    blue:  'text-blue-400  bg-blue-950/50  border-blue-900',
    teal:  'text-teal-400  bg-teal-950/50  border-teal-900',
    green: 'text-green-400 bg-green-950/50 border-green-900',
    amber: 'text-amber-400 bg-amber-950/50 border-amber-900',
  }
  return (
    <div className={`rounded-xl border p-4 ${cores[cor]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-zinc-400 mt-1">{label}</p>
    </div>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500 text-sm">
      {texto}
    </div>
  )
}