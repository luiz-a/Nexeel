'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento, ScheduleStatus, Turno } from '@/types'
import { TURNOS, STATUS_CONFIG } from '@/types'

interface Props { agendamentos: Agendamento[] }

const STATUS_OPTS: { value: ScheduleStatus | 'todos'; label: string }[] = [
  { value: 'todos',    label: 'Todos'      },
  { value: 'pendente', label: 'Pendentes'  },
  { value: 'aprovado', label: 'Aprovados'  },
  { value: 'recusado', label: 'Recusados'  },
  { value: 'cancelado',label: 'Cancelados' },
]

export function AgendamentosClient({ agendamentos: init }: Props) {
  const supabase = createClient()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(init)
  const [filtroStatus, setFiltroStatus] = useState<ScheduleStatus | 'todos'>('todos')
  const [filtroTurno,  setFiltroTurno]  = useState<Turno | 'todos'>('todos')

  const handleCancelar = async (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
    setAgendamentos(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'cancelado' } : a)
    )
  }

  const filtrados = agendamentos.filter(a => {
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false
    if (filtroTurno  !== 'todos' && a.turno  !== filtroTurno)  return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Agendamentos</h1>
        <p className="text-sm text-zinc-500">{filtrados.length} registros</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Status</label>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setFiltroStatus(o.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${filtroStatus === o.value
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Turno</label>
          <div className="flex gap-1.5">
            {(['todos', 'manha', 'tarde', 'noite'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTurno(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${filtroTurno === t
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
              >
                {t === 'todos' ? 'Todos' : `${TURNOS[t].emoji} ${TURNOS[t].label}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500 text-sm">
          Nenhum agendamento encontrado.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {filtrados.map(a => {
              const turno  = TURNOS[a.turno]
              const status = STATUS_CONFIG[a.status]
              const user   = (a as any).profiles
              const cart   = (a as any).carrinhos
              const loc    = (a as any).locais

              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Data + turno */}
                  <div className="min-w-[90px] flex-shrink-0">
                    <p className="text-sm font-medium text-amber-400">
                      {format(parseISO(a.data), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {turno.emoji} {turno.label}
                    </p>
                  </div>

                  {/* Usuário */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.full_name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                  </div>

                  {/* Carrinho + local */}
                  <div className="hidden md:block min-w-[140px] flex-shrink-0">
                    <p className="text-sm text-zinc-300">{cart?.nome}</p>
                    <p className="text-xs text-zinc-500">{loc?.nome}</p>
                  </div>

                  {/* Status */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${status.color}`}>
                    {status.label}
                  </span>

                  {/* Ação cancelar (só aprovado) */}
                  {a.status === 'aprovado' && (
                    <button
                      onClick={() => handleCancelar(a.id)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}