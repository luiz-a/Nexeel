import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const record = payload.record
    const oldRecord = payload.old_record

    // Só processa quando status muda
    if (!record || record.status === oldRecord?.status) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    // Buscar dados do agendamento
    const { data: agendamento } = await supabase
      .from('agendamentos')
      .select('*, profiles(full_name, email), carrinhos(nome), locais(nome)')
      .eq('id', record.id)
      .single()

    if (!agendamento) return NextResponse.json({ ok: true })

    const usuario = (agendamento as any).profiles
    const carrinho = (agendamento as any).carrinhos

    let titulo = ''
    let corpo = ''
    let url = '/agendar'

    if (record.status === 'aprovado') {
      titulo = 'Agendamento aprovado!'
      corpo = `Seu ${carrinho?.nome} foi aprovado para ${formatarData(record.data)} - ${formatarTurno(record.turno)}`
    } else if (record.status === 'recusado') {
      titulo = 'Agendamento recusado'
      corpo = `Seu ${carrinho?.nome} em ${formatarData(record.data)} foi recusado.${record.obs_admin ? ' Motivo: ' + record.obs_admin : ''}`
    } else if (record.status === 'pendente') {
      // Novo agendamento — notificar admin
      titulo = 'Nova solicitacao de agendamento'
      corpo = `${usuario?.full_name} solicitou ${carrinho?.nome} em ${formatarData(record.data)}`
      url = '/dashboard'

      // Buscar subscriptions do admin
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .eq('is_active', true)

      if (admins && admins.length > 0) {
        const adminIds = admins.map((a: any) => a.id)
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', adminIds)

        if (subs && subs.length > 0) {
          await enviarPush(subs, titulo, corpo, url)
        }
      }

      return NextResponse.json({ ok: true })
    }

    // Buscar subscription do usuário
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', record.usuario_id)

    if (subs && subs.length > 0) {
      await enviarPush(subs, titulo, corpo, url)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro no webhook push:', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}

async function enviarPush(subs: any[], titulo: string, corpo: string, url: string) {
  const payload = JSON.stringify({ title: titulo, body: corpo, url })

  await Promise.allSettled(
    subs.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}


function formatarTurno(turno: string) {
  const turnos: Record<string, string> = {
    manha: 'Manha (07h-12h)',
    tarde: 'Tarde (12h-18h)',
    noite: 'Noite (18h-23h)',
  }
  return turnos[turno] ?? turno
}