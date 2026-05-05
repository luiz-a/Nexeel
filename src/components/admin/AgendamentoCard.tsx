'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Agendamento } from '@/types'
import { TURNOS } from '@/types'

interface Props {
  agendamento: Agendamento
  onAprovar: (id: string, obs?: string) => Promise<void>
  onRecusar: (id: string, obs?: string) => Promise<void>
}

export function AgendamentoCard({ agendamento: a, onAprovar, onRecusar }: Props) {
  const [loading, setLoading] = useState<'aprovar' | 'recusar' | null>(null)
  const [mostrarObs, setMostrarObs] = useState(false)
  const [obs, setObs] = useState('')

  const usuario  = (a as any).profiles
  const carrinho = (a as any).carrinhos
  const local    = (a as any).locais
  const turno    = TURNOS[a.turno]

  const handleAcao = async (acao: 'aprovar' | 'recusar') => {
    setLoading(acao)
    if (acao === 'aprovar') await onAprovar(a.id, obs || undefined)
    else await onRecusar(a.id, obs || undefined)
    setLoading(null)
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="p-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30
                            flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
              {usuario?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold">{usuario?.full_name ?? '—'}</p>
              <p className="text-xs text-zinc-500">{usuario?.email}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-amber-400">
              {format(parseISO(a.data), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            <p className="text-sm text-zinc-400">
              {turno.emoji} {turno.label} · {turno.inicio}–{turno.fim}
            </p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
            🛒 {carrinho?.nome ?? '—'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
            📍 {local?.nome ?? '—'}
          </span>
        </div>

        {/* Observação do usuário */}
        {a.observacao && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-0.5">Observação:</p>
            <p className="text-sm text-zinc-300">{a.observacao}</p>
          </div>
        )}

        <p className="text-xs text-zinc-600 mt-3">
          Solicitado {format(parseISO(a.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Campo de obs do admin */}
      {mostrarObs && (
        <div className="px-5 pb-4">
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Observação para o usuário (opcional)..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                       text-sm text-white placeholder-zinc-500 resize-none
                       focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Ações */}
      <div className="px-5 pb-5 flex items-center gap-2">
        <button
          onClick={() => handleAcao('aprovar')}
          disabled={loading !== null}
          className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500
                     text-white font-semibold text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all active:scale-[0.98]"
        >
          {loading === 'aprovar' ? '...' : '✓ Aprovar'}
        </button>

        <button
          onClick={() => handleAcao('recusar')}
          disabled={loading !== null}
          className="flex-1 py-2.5 rounded-xl bg-red-950 hover:bg-red-900
                     border border-red-800 text-red-400 font-semibold text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all active:scale-[0.98]"
        >
          {loading === 'recusar' ? '...' : '✕ Recusar'}
        </button>

        <button
          onClick={() => setMostrarObs(!mostrarObs)}
          title="Adicionar observação"
          className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-all"
        >
          📝
        </button>
      </div>
    </div>
  )
}