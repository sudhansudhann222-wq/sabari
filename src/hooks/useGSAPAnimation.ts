import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useGSAPScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: {
    y?: number
    stagger?: number
    duration?: number
    delay?: number
    threshold?: string
  } = {}
) {
  const containerRef = useRef<T>(null)
  const { y = 30, stagger = 0.12, duration = 0.7, delay = 0, threshold = 'top 85%' } = options

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !containerRef.current) return

    const elements = containerRef.current.children
    if (!elements || elements.length === 0) return

    const ctx = gsap.context(() => {
      gsap.from(elements, {
        y,
        opacity: 0,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: threshold,
          toggleActions: 'play none none none'
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [y, stagger, duration, delay, threshold])

  return containerRef
}

