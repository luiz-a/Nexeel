import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import type { Profile, Notificacao } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = data as Profile | null

  if (!profile || profile.role !== 'admin') redirect('/login')

  const { data: notifData } = await supabase
    .from('notificacoes')
    .select('*, profiles(full_name)')
    .eq('lida', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const notificacoes = (notifData ?? []) as Notificacao[]

  return (
    <div className="min-h-screen bg-zinc-950">
      <AdminHeader profile={profile} notificacoesIniciais={notificacoes} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}