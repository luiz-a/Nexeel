import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ erro: 'Campos obrigatorios faltando' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'user' },
    })

    if (error) {
      const msg = error.message.includes('already')
        ? 'E-mail ja cadastrado'
        : error.message
      return NextResponse.json({ erro: msg }, { status: 400 })
    }

    // Aguardar o trigger criar o profile
    await new Promise(resolve => setTimeout(resolve, 500))

    const { data: novoProfile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({ usuario: novoProfile }, { status: 201 })

  } catch (err) {
    console.error('Erro na API criar usuario:', err)
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 })
  }
}