import { useEffect, useState } from 'react'

interface Props {
  active: boolean
  onComplete: () => void
}

export default function ModeTransition({ active, onComplete }: Props) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) {
      setPhase(0)
      return
    }

    setPhase(1)
    const t1 = setTimeout(() => setPhase(2), 300)
    const t2 = setTimeout(() => setPhase(3), 700)
    const t3 = setTimeout(() => {
      setPhase(0)
      onComplete()
    }, 1200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [active, onComplete])

  if (phase === 0) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Radial burst */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          background: `radial-gradient(circle at center,
            rgba(56, 175, 216, ${phase >= 2 ? 0.15 : 0}) 0%,
            rgba(168, 85, 247, ${phase >= 2 ? 0.1 : 0}) 30%,
            rgba(236, 72, 153, ${phase >= 2 ? 0.05 : 0}) 60%,
            transparent 80%)`,
          transition: 'all 0.5s ease-out',
        }}
      />

      {/* Expanding rings */}
      {phase >= 1 && (
        <>
          <div
            className="absolute w-32 h-32 rounded-full border-2 border-accent"
            style={{
              animation: 'beyond-ripple 0.8s ease-out forwards',
              animationDelay: '0ms',
            }}
          />
          <div
            className="absolute w-32 h-32 rounded-full border-2 border-beyond-2"
            style={{
              animation: 'beyond-ripple 0.8s ease-out forwards',
              animationDelay: '150ms',
            }}
          />
          <div
            className="absolute w-32 h-32 rounded-full border-2 border-beyond-3"
            style={{
              animation: 'beyond-ripple 0.8s ease-out forwards',
              animationDelay: '300ms',
            }}
          />
        </>
      )}

      {/* Center flash */}
      {phase >= 2 && (
        <div
          className="w-4 h-4 rounded-full bg-accent"
          style={{ animation: 'beyond-pulse 0.6s ease-out forwards' }}
        />
      )}

      {/* Scan line */}
      {phase >= 2 && (
        <div
          className="absolute left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #38AFD8, #a855f7, #ec4899, transparent)',
            top: '50%',
            animation: 'shimmer 0.6s linear',
          }}
        />
      )}
    </div>
  )
}
