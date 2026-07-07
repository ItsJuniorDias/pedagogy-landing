import { useCallback } from 'react'
import { resolveAppTarget } from '../device.js'
import { trackDownloadClick } from '../lib/pixel.js'
import { useAppGate } from '../components/EmailGate.jsx'

/**
 * Props for any "get the app" CTA — spread the result onto an
 * <a> / <motion.a> and drop the old `href`:
 *
 *   const app = useGetApp()
 *   <motion.a {...app} className="btn3d b-pink">Download free</motion.a>
 *
 * • iOS / desktop → App Store (nova aba, mantém a landing aberta)
 * • Android       → rota /login (transição SPA rápida, app web)
 *
 * O clique passa pelo EMAIL GATE (components/EmailGate.jsx): se ainda não temos
 * o email do visitante, abrimos um modal pedindo-o (uma única vez) ANTES de
 * seguir pro destino — é isto que alimenta o Advanced Matching e faz a EMQ
 * subir. Com o email já conhecido, o gate é pulado e o destino abre na hora.
 *
 * `href` continua apontando pro destino, então clique com botão do meio /
 * "abrir em nova aba" seguem funcionando normalmente.
 */
export function useGetApp({ placement, cta, plan } = {}) {
  const target = resolveAppTarget()
  const { requestApp } = useAppGate()

  const onClick = useCallback(
    (e) => {
      // Interceptamos SEMPRE: mesmo no link externo, precisamos passar pelo gate
      // antes de abrir a App Store.
      e.preventDefault()

      // Registra a intenção de download antes de navegar. Dispara tanto pra App
      // Store quanto pro fallback web, então nenhum clique se perde.
      trackDownloadClick({
        placement,
        cta,
        plan,
        destination: target.external ? 'app_store' : 'web_app',
      })

      // Abre o gate (ou vai direto, se já soubermos o email).
      requestApp({ placement, cta, plan, target })
    },
    [target.external, target.to, placement, cta, plan, requestApp],
  )

  return {
    href: target.to,
    onClick,
    ...(target.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }
}
