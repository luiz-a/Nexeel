'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Item {
  id: string
  nome: string
  descricao?: string | null
  is_active: boolean
  created_at: string
}

interface Props {
  tipo: 'carrinho' | 'local'
  titulo: string
  emoji: string
  itens: Item[]
}

export function RecursosClient({ tipo, titulo, emoji, itens: init }: Props) {
  const supabase = createClient()
  const [itens, setItens] = useState<Item[]>(init)
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const tabela = tipo === 'carrinho' ? 'carrinhos' : 'locais'

  const handleCriar = async () => {
    if (!nome.trim()) { setErro('Nome obrigatório'); return }
    setSalvando(true)
    setErro(null)

    const payload: any = { nome: nome.trim(), is_active: true }
    if (tipo === 'local' && descricao.trim()) payload.descricao = descricao.trim()

    const { data, error } = await supabase
      .from(tabela as any)
      .insert(payload)
      .select()
      .single()

    setSalvando(false)

    if (error) { setErro('Erro ao criar. Tente novamente.'); return }

    setItens(prev => [...prev, data as Item])
    setNome('')
    setDescricao('')
    setShowForm(false)
  }

  const handleToggle = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from(tabela as any)
      .update({ is_active: !ativo })
      .eq('id', id)

    if (!error) {
      setItens(prev => prev.map(i => i.id === id ? { ...i, is_active: !ativo } : i))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{emoji} {titulo}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400
                     text-black font-semibold text-sm transition-all"
        >
          + Novo {tipo === 'carrinho' ? 'carrinho' : 'local'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">
            Adicionar {tipo === 'carrinho' ? 'carrinho' : 'local'}
          </h2>

          {erro && (
            <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm">
              {erro}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Nome</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder={tipo === 'carrinho' ? 'Ex: Carrinho 4' : 'Ex: Bloco B'}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                         text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {tipo === 'local' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">
                Descrição <span className="text-zinc-600">(opcional)</span>
              </label>
              <input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Corredor principal do bloco B"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                           text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCriar}
              disabled={salvando}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400
                         text-black font-semibold text-sm disabled:opacity-50 transition-all"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNome(''); setDescricao(''); setErro(null) }}
              className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <p className="text-sm text-zinc-400">{itens.length} {titulo.toLowerCase()} cadastrado(s)</p>
        </div>

        {itens.length === 0 ? (
          <p className="py-12 text-center text-zinc-500 text-sm">
            Nenhum {tipo === 'carrinho' ? 'carrinho' : 'local'} cadastrado.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {itens.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700
                                flex items-center justify-center text-lg flex-shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.nome}</p>
                  {item.descricao && (
                    <p className="text-sm text-zinc-500 truncate">{item.descricao}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Criado em {format(parseISO(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0
                  ${item.is_active
                    ? 'text-green-400 bg-green-950 border-green-800'
                    : 'text-zinc-500 bg-zinc-800 border-zinc-700'}`}>
                  {item.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  onClick={() => handleToggle(item.id, item.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0
                    ${item.is_active
                      ? 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-800'
                      : 'bg-green-950 hover:bg-green-900 text-green-400 border border-green-800'}`}
                >
                  {item.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}