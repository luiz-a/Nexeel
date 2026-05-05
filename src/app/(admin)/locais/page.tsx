import { createClient } from '@/lib/supabase/server'
import { RecursosClient } from '@/components/admin/RecursosClient'

export const dynamic = 'force-dynamic'

export default async function LocaisPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('locais')
    .select('*')
    .order('nome')

  return (
    <RecursosClient
      tipo="local"
      titulo="Locais"
      emoji="📍"
      itens={(data ?? []).map(d => ({ id: d.id, nome: d.nome, descricao: d.descricao, is_active: d.is_active, created_at: d.created_at }))}
    />
  )
}