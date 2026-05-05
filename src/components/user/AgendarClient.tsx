'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { agendamentoSchema, type AgendamentoFormData } from '@/lib/validations'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Agendamento, Carrinho, Local, Turno } from '@/types'
import { TURNOS, STATUS_CONFIG } from '@/types'

interface Props {
  carrinhos: Carrinho[]
  locais: Local[]
  meusAgendamentos: Agendamento[]
  userId: string
}

export function AgendarClient({ carrinhos, locais, meusAgendamentos: initMeus, userId }: Props) {
  const supabase = createClient()
  const [ocupados, setOcupados] = useState<Agendamento[]>([])
  const [meusAgendamentos, setMeusAgendamentos] = useState<Agendamento[]>(initMeus)
  const [sucesso, setSucesso] = useState(false)
  const [erroConflito, setErroConflito] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
  })

  const watchData  = watch('data')
  const watchTurno = watch('turno')

  // Buscar agendamentos ocupados quando data ou turno mudar
  useEffect(() => {
    if (!watchData || !watchTurno) return
    const dataStr = format(watchData, 'yyyy-MM-dd')

    supabase
      .from('agendamentos')
      .select('*')
      .eq('data', dataStr)
      .eq('turno', watchTurno)
      .in('status', ['pendente', 'aprovado'])
      .then(({ data }) => setOcupados(data ?? []))
  }, [watchData, watchTurno])

  // Realtime: atualizar ocupados em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('user:agendamentos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        () => {
          // Re-buscar ocupados na data/turno atual
          if (!watchData || !watchTurno) return
          const dataStr = format(watchData, 'yyyy-MM-dd')
          supabase
            .from('agendamentos')
            .select('*')
            .eq('data', dataStr)
            .eq('turno', watchTurno)
            .in('status', ['pendente', 'aprovado'])
            .then(({ data }) => setOcupados(data ?? []))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [watchData, watchTurno])

  // IDs de carrinhos já ocupados no turno/data selecionado
  const carrinhosOcupados = new Set(ocupados.map(a => a.carrinho_id))

  const onSubmit = async (data: AgendamentoFormData) => {
    setErroConflito(null)

    // Verificação local antes de bater no banco
    if (carrinhosOcupados.has(data.carrinho_id)) {
      setErroConflito('Este carrinho ja esta ocupado neste turno. Escolha outro.')
      return
    }

    const { data: novo, error } = await supabase
      .from('agendamentos')
      .insert({
        usuario_id:  userId,
        carrinho_id: data.carrinho_id,
        local_id:    data.local_id,
        data:        format(data.data, 'yyyy-MM-dd'),
        turno:       data.turno,
        observacao:  data.observacao ?? null,
        status:      'pendente',
      })
      .select('*, carrinhos(nome), locais(nome)')
      .single()

    if (error) {
      // Conflito detectado pelo banco (unique index)
      if (error.code === '23505') {
        setErroConflito('Este carrinho foi reservado agora por outra pessoa. Escolha outro.')
      } else {
        setErroConflito('Erro ao agendar. Tente novamente.')
      }
      return
    }

    setMeusAgendamentos(prev => [novo, ...prev])
    setSucesso(true)
    reset()
    setTimeout(() => setSucesso(false), 5000)
  }

  const handleCancelar = async (id: string, data: string, turno: Turno) => {
    // Verificar prazo no cliente (1h antes)
    const { data: podeCancelar } = await supabase
      .rpc('pode_cancelar', { p_data: data, p_turno: turno })

    if (!podeCancelar) {
      alert('Nao e possivel cancelar com menos de 1 hora de antecedencia.')
      return
    }

    if (!confirm('Cancelar este agendamento?')) return

    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', id)

    if (!error) {
      setMeusAgendamentos(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'cancelado' } : a)
      )
    }
  }

  return (
    <div className="space-y-8">

      {/* Formulário */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5"
      >
        <h2 className="font-semibold text-lg">Nova solicitacao</h2>

        {sucesso && (
          <div className="p-3 rounded-xl bg-green-950 border border-green-800 text-green-300 text-sm">
            Solicitacao enviada! Aguarde a aprovacao do administrador.
          </div>
        )}

        {erroConflito && (
          <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm">
            {erroConflito}
          </div>
        )}

        {/* Data */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Data</label>
          <Controller
            name="data"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                min={format(new Date(), 'yyyy-MM-dd')}
                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                onChange={e => {
                  const val = e.target.value
                  if (val) field.onChange(new Date(val + 'T12:00:00'))
                }}
                className={input}
              />
            )}
          />
          {errors.data && <p className="text-xs text-red-400">{errors.data.message}</p>}
        </div>

        {/* Turno */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Turno</label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(TURNOS) as [Turno, typeof TURNOS[Turno]][]).map(([key, t]) => (
              <label key={key}
                className="cursor-pointer">
                <input {...register('turno')} type="radio" value={key} className="sr-only" />
                <div className={`p-3 rounded-xl border text-center transition-all
                  ${watch('turno') === key
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                  <p className="text-xl">{t.emoji}</p>
                  <p className="text-xs font-medium mt-1">{t.label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{t.inicio}–{t.fim}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.turno && <p className="text-xs text-red-400">{errors.turno.message}</p>}
        </div>

        {/* Carrinho */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Carrinho</label>
          <div className="grid grid-cols-2 gap-2">
            {carrinhos.map(c => {
              const ocupado = carrinhosOcupados.has(c.id)
              const selecionado = watch('carrinho_id') === c.id
              return (
                <label key={c.id} className={ocupado ? 'cursor-not-allowed' : 'cursor-pointer'}>
                  <input
                    {...register('carrinho_id')}
                    type="radio"
                    value={c.id}
                    disabled={ocupado}
                    className="sr-only"
                  />
                  <div className={`p-3 rounded-xl border text-sm font-medium transition-all
                    ${ocupado
                      ? 'bg-red-950/30 border-red-900 text-red-500 opacity-60'
                      : selecionado
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                    <span className="mr-1.5">🛒</span>
                    {c.nome}
                    {ocupado && <span className="block text-[10px] mt-0.5 text-red-500">Ocupado</span>}
                  </div>
                </label>
              )
            })}
          </div>
          {errors.carrinho_id && <p className="text-xs text-red-400">{errors.carrinho_id.message}</p>}
        </div>

        {/* Local */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">Local de instalacao</label>
          <select {...register('local_id')} className={input}>
            <option value="">Selecione um local</option>
            {locais.map(l => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
          {errors.local_id && <p className="text-xs text-red-400">{errors.local_id.message}</p>}
        </div>

        {/* Observacao */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            Observacao <span className="text-zinc-600">(opcional)</span>
          </label>
          <textarea
            {...register('observacao')}
            rows={2}
            placeholder="Descreva o objetivo do uso..."
            className={`${input} resize-none`}
          />
          {errors.observacao && <p className="text-xs text-red-400">{errors.observacao.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                     text-black font-semibold text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all active:scale-[0.98]"
        >
          {isSubmitting ? 'Enviando...' : 'Solicitar agendamento'}
        </button>
      </form>

      {/* Meus agendamentos */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-zinc-200">Meus agendamentos</h2>

        {meusAgendamentos.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500 text-sm">
            Voce ainda nao fez nenhum agendamento.
          </div>
        ) : (
          <div className="space-y-3">
            {meusAgendamentos.map(a => {
              const turno  = TURNOS[a.turno]
              const status = STATUS_CONFIG[a.status]
              const cart   = (a as any).carrinhos
              const loc    = (a as any).locais

              return (
                <div key={a.id}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">
                        {format(parseISO(a.data), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {turno.emoji} {turno.label} · {cart?.nome} · {loc?.nome}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {a.obs_admin && (
                    <div className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700">
                      <p className="text-xs text-zinc-500">Admin:</p>
                      <p className="text-sm text-zinc-300">{a.obs_admin}</p>
                    </div>
                  )}

                  {/* Botao cancelar so para pendentes */}
                  {a.status === 'pendente' && (
                    <button
                      onClick={() => handleCancelar(a.id, a.data, a.turno)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      Cancelar solicitacao
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

const input = `w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
               text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500`