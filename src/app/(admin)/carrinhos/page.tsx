import { createClient } from '@/lib/supabase/server'
import { RecursosClient } from '@/components/admin/RecursosClient'

export const dynamic = 'force-dynamic'

export default async function CarrinhosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('carrinhos')
    .select('*')
    .order('nome')

  return (
    <RecursosClient
      tipo="carrinho"
      titulo="Carrinhos"
      emoji="🛒"
      itens={(data ?? []).map(d => ({ id: d.id, nome: d.nome, is_active: d.is_active, created_at: d.created_at }))}
    />
  )
}