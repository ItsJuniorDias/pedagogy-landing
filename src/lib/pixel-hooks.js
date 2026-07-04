// -----------------------------------------------------------------------------
// lib/pixel-hooks.js — hooks React que alimentam o Pixel com eventos que não
// nascem de um clique direto (troca de rota, rolagem, entrada na viewport).
// -----------------------------------------------------------------------------
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { pageView, trackScrollDepth } from './pixel.js'

/**
 * Dispara um PageView a CADA troca de rota (SPA). Pula a primeira montagem,
 * porque o index.html já enviou o PageView do carregamento inicial — assim o
 * primeiro acesso não conta em dobro.
 */
export function usePageViews() {
  const location = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    pageView(location.pathname + location.search)
  }, [location.pathname, location.search])
}

/**
 * Dispara ScrollDepth (25/50/75/100 por padrão) uma vez cada, conforme o
 * usuário rola a página atual. Remove o listener assim que todos os marcos
 * foram atingidos.
 */
export function useScrollDepth(milestones = [25, 50, 75, 100]) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fired = new Set()

    const onScroll = () => {
      const el = document.documentElement
      const scrollable = el.scrollHeight - el.clientHeight
      if (scrollable <= 0) return
      const pct = (el.scrollTop / scrollable) * 100
      for (const m of milestones) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m)
          trackScrollDepth(m)
        }
      }
      if (fired.size === milestones.length) {
        window.removeEventListener('scroll', onScroll)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // caso a página já abra rolada
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * Retorna uma ref para anexar a um elemento; chama `onVisible` UMA vez, quando
 * o elemento entra na viewport. Usado para disparar o ViewContent da seção de
 * preços sem depender de um clique.
 */
export function useOnceVisible(onVisible, { threshold = 0.4 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    let done = false

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !done) {
            done = true
            onVisible?.()
            io.disconnect()
          }
        }
      },
      { threshold },
    )

    io.observe(node)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
