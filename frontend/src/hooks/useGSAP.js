import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Hook: scroll-triggered reveal for any selector inside the returned ref element
 */
export function useGSAPScrollReveal(selector, options = {}) {
  const ref = useRef()
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(selector, {
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
          ...options.scrollTrigger,
        },
        opacity: 0,
        y: 60,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        ...options.from,
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return ref
}

/**
 * Hook: parallax on scroll for a given ref element
 */
export function useGSAPParallax(ref, speed = 0.5) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const anim = gsap.to(el, {
      yPercent: -30 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
    return () => anim.kill()
  }, [speed])
}

/**
 * Animate a counter from 0 to target value
 */
export function useGSAPCounter(ref, target, duration = 1.5, suffix = '') {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obj = { val: 0 }
    const anim = gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val) + suffix
      },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    })
    return () => anim.kill()
  }, [target, duration, suffix])
}

export { gsap, ScrollTrigger }
