'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { PushButton } from '@/components/shared/PushButton'

interface Props { profile: Profile }

export function UserHeader({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛒</span>
          <div>
            <p className="font-bold text-white text-sm">Cartinho</p>
            <p className="text-xs text-zinc-500">
              Ola, {profile.full_name.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30
                          flex items-center justify-center text-amber-400 font-bold text-xs">
            {profile.full_name[0].toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Sair
          </button>
          <PushButton userId={profile.id} />
        </div>
      </div>
    </header>
  )
}