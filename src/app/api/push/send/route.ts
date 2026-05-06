import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { subscriptions, title, body, url } = await request.json()

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0 })
    }

    const payload = JSON.stringify({ title, body, url })

    const resultados = await Promise.allSettled(
      subscriptions.map((sub: any) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    )

    const enviados = resultados.filter(r => r.status === 'fulfilled').length

    return NextResponse.json({ ok: true, enviados })
  } catch (err) {
    console.error('Erro ao enviar push:', err)
    return NextResponse.json({ erro: 'Erro ao enviar push' }, { status: 500 })
  }
}