'use client'

import { useState } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function InstallBanner() {
  const { podeInstalar, jaInstalado, isIOS, isAndroid, instalar } = usePWAInstall()
  const [dispensado, setDispensado] = useState(false)
  const [mostrarIOSGuia, setMostrarIOSGuia] = useState(false)

  // Não mostrar se já instalado ou dispensado
  if (jaInstalado || dispensado) return null

  // Nao mostrar em desktop (só mobile)
  if (!isIOS && !isAndroid) return null

  return (
    <>
      {/* Banner principal */}
      <div className="bg-amber-950/60 border border-amber-800/50 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">📲</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-300 text-sm">
              Instale o app no seu celular
            </p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Acesse mais rapido, sem precisar abrir o navegador.
            </p>

            <div className="flex gap-2 mt-3">
              {/* Android: instalação nativa */}
              {isAndroid && podeInstalar && (
                <button
                  onClick={instalar}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400
                             text-black font-semibold text-xs transition-all"
                >
                  Instalar agora
                </button>
              )}

              {/* iOS: mostrar guia manual */}
              {isIOS && (
                <button
                  onClick={() => setMostrarIOSGuia(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400
                             text-black font-semibold text-xs transition-all"
                >
                  Como instalar
                </button>
              )}

              {/* Android sem prompt disponível ainda */}
              {isAndroid && !podeInstalar && (
                <button
                  onClick={() => setMostrarIOSGuia(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400
                             text-black font-semibold text-xs transition-all"
                >
                  Como instalar
                </button>
              )}

              <button
                onClick={() => setDispensado(true)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700
                           text-zinc-400 text-xs transition-all"
              >
                Agora nao
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal com instruções iOS / Android manual */}
      {mostrarIOSGuia && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-white text-lg mb-4">
              Instalar o Cartinho
            </h3>

            {isIOS ? (
              <div className="space-y-3">
                <Passo numero={1} texto='Toque no botao de compartilhar no Safari' emoji="⬆️" />
                <Passo numero={2} texto='Role para baixo e toque em "Adicionar a Tela de Inicio"' emoji="➕" />
                <Passo numero={3} texto='Toque em "Adicionar" no canto superior direito' emoji="✅" />
                <div className="mt-4 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                  <p className="text-xs text-zinc-400">
                    O icone do Cartinho vai aparecer na sua tela inicial igual a um app normal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Passo numero={1} texto="Toque nos 3 pontinhos no canto superior direito do Chrome" emoji="⋮" />
                <Passo numero={2} texto='Toque em "Adicionar a tela inicial"' emoji="➕" />
                <Passo numero={3} texto='Toque em "Adicionar"' emoji="✅" />
                <div className="mt-4 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                  <p className="text-xs text-zinc-400">
                    O icone do Cartinho vai aparecer na sua tela inicial igual a um app normal.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => { setMostrarIOSGuia(false); setDispensado(true) }}
              className="w-full mt-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                         text-black font-semibold text-sm transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Passo({ numero, texto, emoji }: { numero: number; texto: string; emoji: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center
                      text-black font-bold text-xs flex-shrink-0 mt-0.5">
        {numero}
      </div>
      <p className="text-sm text-zinc-300 flex-1">
        {texto} <span className="ml-1">{emoji}</span>
      </p>
    </div>
  )
}