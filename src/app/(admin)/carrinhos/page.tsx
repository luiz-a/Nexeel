import { createClient } from '@/lib/supabase/server'
import { RecursosClient } from '@/components/admin/RecursosClient'
import type { Carrinho } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CarrinhosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('carrinhos')
    .select('*')
    .order('nome')

  const itens: Carrinho[] = (data ?? []) as Carrinho[]

  return (
    <RecursosClient
      tipo="carrinho"
      titulo="Carrinhos"
      emoji="🛒"
      itens={itens}
    />
  )
}