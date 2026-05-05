import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/admin/DashboardClient'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const hoje = format(new Date(), 'yyyy-MM-dd')

  const [
    { data: pendentes },
    { data: agendamentosHoje },
    { count: totalUsuarios },
    { count: totalCarrinhos },
  ] = await Promise.all([
    supabase
      .from('agendamentos')
      .select('*, profiles(full_name, email), carrinhos(nome), locais(nome)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false }),

    supabase
      .from('agendamentos')
      .select('*, profiles(full_name), carrinhos(nome), locais(nome)')
      .eq('data', hoje)
      .in('status', ['pendente', 'aprovado'])
      .order('turno'),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .eq('is_active', true),

    supabase
      .from('carrinhos')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  return (
    <DashboardClient
      pendentes={pendentes ?? []}
      agendamentosHoje={agendamentosHoje ?? []}
      totalUsuarios={totalUsuarios ?? 0}
      totalCarrinhos={totalCarrinhos ?? 0}
    />
  )
}