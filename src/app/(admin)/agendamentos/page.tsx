import { createClient } from '@/lib/supabase/server'
import { AgendamentosClient } from '@/components/admin/AgendamentosClient'

export const dynamic = 'force-dynamic'

export default async function AgendamentosPage() {
  const supabase = await createClient()

  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('*, profiles(full_name, email), carrinhos(nome), locais(nome)')
    .order('data', { ascending: false })
    .order('turno')
    .limit(100)

  return <AgendamentosClient agendamentos={agendamentos ?? []} />
}