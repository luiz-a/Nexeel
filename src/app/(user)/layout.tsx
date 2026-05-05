import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserHeader } from '@/components/user/UserHeader'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'user') redirect('/login')
  if (!profile.is_active) redirect('/login?erro=conta_desativada')

  return (
    <div className="min-h-screen bg-zinc-950">
      <UserHeader profile={profile} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}