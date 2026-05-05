import { createClient } from '@/lib/supabase/server'
import { UsuariosClient } from '@/components/admin/UsuariosClient'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  return <UsuariosClient usuarios={usuarios ?? []} />
}