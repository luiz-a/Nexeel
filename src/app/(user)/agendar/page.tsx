import { createClient } from '@/lib/supabase/server'
import { AgendarClient } from '@/components/user/AgendarClient'
import { InstallBanner } from '@/components/shared/InstallBanner'

export const dynamic = 'force-dynamic'

export default async function AgendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: carrinhos },
    { data: locais },
    { data: meuAgendamentos },
  ] = await Promise.all([
    supabase
      .from('carrinhos')
      .select('*')
      .eq('is_active', true)
      .order('nome'),

    supabase
      .from('locais')
      .select('*')
      .eq('is_active', true)
      .order('nome'),

    supabase
      .from('agendamentos')
      .select('*, carrinhos(nome), locais(nome)')
      .eq('usuario_id', user!.id)
      .order('data', { ascending: false })
      .limit(10),
  ])

  return (
    <>
      <InstallBanner />
      <AgendarClient
        carrinhos={carrinhos ?? []}
        locais={locais ?? []}
        meusAgendamentos={meuAgendamentos ?? []}
        userId={user!.id}
      />
    </>
  )
}