'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { criarUsuarioSchema, type CriarUsuarioFormData } from '@/lib/validations'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Profile } from '@/types'

interface Props { usuarios: Profile[] }

export function UsuariosClient({ usuarios: init }: Props) {
  const [usuarios, setUsuarios] = useState<Profile[]>(init)
  const [showForm, setShowForm] = useState(false)
  const [erroServer, setErroServer] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<CriarUsuarioFormData>({ resolver: zodResolver(criarUsuarioSchema) })

  const onCriar = async (data: CriarUsuarioFormData) => {
    setErroServer(null)
    const res = await fetch('/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setErroServer(json.erro ?? 'Erro ao criar usuário'); return }
    setUsuarios(prev => [json.usuario, ...prev])
    setSucesso(`Usuário ${data.full_name} criado com sucesso!`)
    setShowForm(false)
    reset()
    setTimeout(() => setSucesso(null), 4000)
  }

  const handleToggle = async (id: string, ativo: boolean) => {
    const res = await fetch('/api/usuarios/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, is_active: !ativo }),
    })
    if (res.ok) {
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, is_active: !ativo } : u))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Usuários</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400
                     text-black font-semibold text-sm transition-all"
        >
          + Novo usuário
        </button>
      </div>

      {sucesso && (
        <div className="p-3 rounded-xl bg-green-950 border border-green-800 text-green-300 text-sm">
          ✅ {sucesso}
        </div>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="font-semibold mb-5">Criar novo usuário</h2>
          <form onSubmit={handleSubmit(onCriar)} className="space-y-4">
            {erroServer && (
              <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm">
                {erroServer}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Nome completo" erro={errors.full_name?.message}>
                <input {...register('full_name')} placeholder="João Silva"
                  className={input} />
              </Campo>
              <Campo label="E-mail" erro={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="joao@email.com"
                  className={input} />
              </Campo>
              <Campo label="Senha inicial" erro={errors.password?.message} full>
                <input {...register('password')} type="password"
                  placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                  className={input} />
              </Campo>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400
                           text-black font-semibold text-sm disabled:opacity-50 transition-all">
                {isSubmitting ? 'Criando...' : 'Criar usuário'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset() }}
                className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-all">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <p className="text-sm text-zinc-400">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        {usuarios.length === 0 ? (
          <p className="py-12 text-center text-zinc-500 text-sm">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30
                                flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                  {u.full_name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.full_name}</p>
                  <p className="text-sm text-zinc-500 truncate">{u.email}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Desde {format(parseISO(u.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0
                  ${u.is_active
                    ? 'text-green-400 bg-green-950 border-green-800'
                    : 'text-zinc-500 bg-zinc-800 border-zinc-700'}`}>
                  {u.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  onClick={() => handleToggle(u.id, u.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0
                    ${u.is_active
                      ? 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-800'
                      : 'bg-green-950 hover:bg-green-900 text-green-400 border border-green-800'}`}
                >
                  {u.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const input = `w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
               text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500`

function Campo({ label, erro, full, children }: {
  label: string; erro?: string; full?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${full ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  )
}