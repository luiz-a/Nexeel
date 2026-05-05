import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── Rota pública: /login ──────────────────────────────────
  if (pathname === '/login') {
    if (user) {
      // Já logado → redireciona pro lugar certo
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const destino = profile?.role === 'admin' ? '/dashboard' : '/agendar'
      return NextResponse.redirect(new URL(destino, request.url))
    }
    return supabaseResponse
  }

  // ── Sem sessão → login ────────────────────────────────────
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Buscar perfil com role ────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // Conta desativada → logout e mensagem
  if (!profile?.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(
      new URL('/login?erro=conta_desativada', request.url)
    )
  }

  const isAdmin = profile?.role === 'admin'

  // ── Rotas exclusivas do admin ─────────────────────────────
  const rotasAdmin = ['/dashboard', '/agendamentos', '/usuarios', '/carrinhos', '/locais']
  const isRotaAdmin = rotasAdmin.some(r => pathname.startsWith(r))

  if (isRotaAdmin && !isAdmin) {
    return NextResponse.redirect(new URL('/agendar', request.url))
  }

  // ── Rotas exclusivas do usuário ───────────────────────────
  if (pathname.startsWith('/agendar') && isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Ignorar arquivos estáticos e API routes internas
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}