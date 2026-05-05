'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { useAuthStore } from '@/stores/auth.store'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setProfile } = useAuthStore()
  const [erro, setErro] = useState<string | null>(null)

  const contaDesativada = searchParams.get('erro') === 'conta_desativada'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setErro(null)
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) { setErro('E-mail ou senha incorretos'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (!profile) { setErro('Perfil não encontrado'); return }

    if (!profile.is_active) {
      await supabase.auth.signOut()
      setErro('Sua conta foi desativada. Contate o administrador.')
      return
    }

    // Notificar admin sobre o login em tempo real
    await supabase.from('notificacoes').insert({
      tipo: 'login',
      titulo: 'Usuário entrou no sistema',
      mensagem: `${profile.full_name} (${profile.email}) fez login agora.`,
      usuario_id: profile.id,
    })

    setProfile(profile)
    router.push(profile.role === 'admin' ? '/dashboard' : '/agendar')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cartinho</h1>
          <p className="text-zinc-400 mt-1 text-sm">Sistema de Agendamento</p>
        </div>

        {contaDesativada && (
          <div className="mb-4 p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm">
            Sua conta foi desativada pelo administrador.
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5"
        >
          {erro && (
            <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm">
              {erro}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">E-mail</label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                         text-white placeholder-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Senha</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700
                         text-white placeholder-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                       text-black font-semibold text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Não tem acesso? Solicite ao administrador.
        </p>
      </div>
    </main>
  )
}