import { createClient } from '@/lib/supabase/server'
import { RecursosClient } from '@/components/admin/RecursosClient'
import type { Local } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LocaisPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('locais')
    .select('*')
    .order('nome')

  const itens: Local[] = (data ?? []) as Local[]

  return (
    <RecursosClient
      tipo="local"
      titulo="Locais"
      emoji="📍"
      itens={itens}
    />
  )
}