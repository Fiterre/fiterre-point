'use client'

import { useRef, useEffect, useState } from 'react'
import type { MemberRank } from '@/types/database'

interface Props {
  rank: MemberRank
  displayName: string | null
  memberSince?: string
  rankUpKey?: string
}

const RANK_CONFIG: Record<MemberRank, {
  label: string
  bg: string
  shimmer: string
  text: string
  accent: string
  glow: string
}> = {
  bronze: {
    label: 'BRONZE',
    bg: 'linear-gradient(155deg, #1C0D00 0%, #6B3010 18%, #B86B28 36%, #D48840 50%, #9B5018 65%, #4A1E06 84%, #1A0A00 100%)',
    shimmer: 'rgba(200,120,48,0.45)',
    text: '#FFE8C0',
    accent: '#D9A86A',
    glow: '0 14px 52px rgba(100,40,5,0.9), 0 4px 16px rgba(0,0,0,0.95)',
  },
  silver: {
    label: 'SILVER',
    bg: 'linear-gradient(155deg, #141414 0%, #3E3E3E 18%, #868686 35%, #C2C2C2 50%, #DADADA 58%, #888888 74%, #3A3A3A 90%, #0F0F0F 100%)',
    shimmer: 'rgba(198,198,198,0.5)',
    text: '#111111',
    accent: '#CECECE',
    glow: '0 14px 52px rgba(40,40,40,0.88), 0 4px 16px rgba(0,0,0,0.95)',
  },
  gold: {
    label: 'GOLD',
    bg: 'linear-gradient(155deg, #150B00 0%, #583800 18%, #AE7E00 35%, #D2A600 50%, #EEC000 58%, #9E7600 74%, #482C00 90%, #150B00 100%)',
    shimmer: 'rgba(238,192,0,0.45)',
    text: '#1A0E00',
    accent: '#EECA40',
    glow: '0 14px 56px rgba(160,118,0,0.9), 0 4px 16px rgba(0,0,0,0.95)',
  },
  platinum: {
    label: 'PLATINUM',
    bg: 'linear-gradient(155deg, #0C0C0C 0%, #363636 18%, #666666 35%, #B2B2B2 50%, #E6E6E6 58%, #AEAEAE 70%, #464646 88%, #0C0C0C 100%)',
    shimmer: 'rgba(238,238,238,0.6)',
    text: '#080808',
    accent: '#E6E6E6',
    glow: '0 14px 56px rgba(158,158,158,0.85), 0 4px 16px rgba(0,0,0,0.95)',
  },
  diamond: {
    label: 'DIAMOND',
    bg: 'linear-gradient(155deg, #00060E 0%, #001A2E 18%, #003650 35%, #006680 48%, #009EC0 58%, #005E78 70%, #001A2E 88%, #00060E 100%)',
    shimmer: 'rgba(0,178,218,0.5)',
    text: '#C0F0FF',
    accent: '#3ED6F6',
    glow: '0 14px 60px rgba(0,118,178,0.9), 0 4px 16px rgba(0,0,0,0.95)',
  },
}

export default function GradeCard3D({ rank, displayName, memberSince, rankUpKey }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const shimmerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const isHoveredRef = useRef(false)
  const isDraggingRef = useRef(false)
  const autoAngleRef = useRef(0)
  const rotationRef = useRef({ x: 0, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(Date.now())
  const animFrameRef = useRef<number>(0)

  const cfg = RANK_CONFIG[rank]

  // 統合アニメーションループ（依存なし・ref経由でアクセス）
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const animate = () => {
      if (isDraggingRef.current) {
        animFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const vx = velocityRef.current.x
      const vy = velocityRef.current.y
      const speed = Math.sqrt(vx * vx + vy * vy)

      if (speed > 0.05) {
        // 慣性フェーズ: 摩擦係数0.92で減速
        const friction = 0.92
        velocityRef.current.x *= friction
        velocityRef.current.y *= friction
        rotationRef.current.x += velocityRef.current.y * 0.3
        rotationRef.current.y += velocityRef.current.x * 0.3
        card.style.transform = `rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`
      } else if (!isHoveredRef.current) {
        // 自動回転フェーズ
        velocityRef.current = { x: 0, y: 0 }
        autoAngleRef.current = (autoAngleRef.current + 0.3) % 360
        const y = autoAngleRef.current
        const x = Math.sin((y * Math.PI) / 180) * 8
        rotationRef.current = { x, y: y % 60 - 30 }
        card.style.transform = `rotateY(${rotationRef.current.y}deg) rotateX(${rotationRef.current.x}deg)`
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  // 昇格アニメーション: 未表示の rankUpKey であれば 700ms 後に表示
  useEffect(() => {
    if (!rankUpKey) return
    const key = `rankup_seen_${rankUpKey}`
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => {
        setShowCelebration(true)
        localStorage.setItem(key, '1')
      }, 700)
      return () => clearTimeout(t)
    }
  }, [rankUpKey])

  // 4.5秒後に自動クローズ
  useEffect(() => {
    if (!showCelebration) return
    const t = setTimeout(() => setShowCelebration(false), 4500)
    return () => clearTimeout(t)
  }, [showCelebration])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    setIsDragging(true)
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    lastTimeRef.current = Date.now()
    velocityRef.current = { x: 0, y: 0 }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current
    const shimmer = shimmerRef.current
    if (!card) return

    if (isDraggingRef.current) {
      const now = Date.now()
      const dt = Math.max(now - lastTimeRef.current, 1)
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y

      velocityRef.current = {
        x: (dx / dt) * 16,
        y: (dy / dt) * 16,
      }

      rotationRef.current.y += dx * 0.5
      rotationRef.current.x -= dy * 0.5
      rotationRef.current.x = Math.max(-50, Math.min(50, rotationRef.current.x))
      card.style.transform = `rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`

      lastPosRef.current = { x: e.clientX, y: e.clientY }
      lastTimeRef.current = now
    } else if (isHoveredRef.current) {
      const rect = card.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      const rotX = -(dy / (rect.height / 2)) * 25
      const rotY = (dx / (rect.width / 2)) * 25
      rotationRef.current = { x: rotX, y: rotY }
      card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
    }

    if (shimmer && card) {
      const rect = card.getBoundingClientRect()
      const pctX = ((e.clientX - rect.left) / rect.width) * 100
      const pctY = ((e.clientY - rect.top) / rect.height) * 100
      shimmer.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${cfg.shimmer} 0%, transparent 60%)`
      shimmer.style.opacity = '1'
    }
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
    setIsDragging(false)
  }

  const handleMouseEnter = () => {
    isHoveredRef.current = true
  }

  const handleMouseLeave = () => {
    if (!isDraggingRef.current) {
      isHoveredRef.current = false
      const shimmer = shimmerRef.current
      if (shimmer) shimmer.style.opacity = '0'
    }
  }

  const year = memberSince ? new Date(memberSince).getFullYear() : new Date().getFullYear()

  return (
    <>
      {/* ブラックアウト昇格演出オーバーレイ */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-500"
          style={{ background: 'rgba(0,0,0,0.78)', cursor: 'pointer' }}
          onClick={() => setShowCelebration(false)}
        >
          <div className="text-center animate-in zoom-in-95 duration-700 select-none px-10">
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
            <div style={{
              fontSize: 10, letterSpacing: '0.42em',
              color: 'rgba(255,255,255,0.44)', marginBottom: 10,
            }}>
              RANK UP
            </div>
            <div style={{
              fontSize: 38, fontWeight: 900, letterSpacing: '0.18em',
              color: cfg.accent,
              textShadow: `0 0 48px ${cfg.shimmer}, 0 0 80px ${cfg.shimmer}`,
              marginBottom: 6,
            }}>
              {cfg.label}
            </div>
            <div style={{
              fontSize: 17, color: 'rgba(255,255,255,0.85)',
              marginBottom: 38,
            }}>
              おめでとうございます！
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.32)',
              letterSpacing: '0.12em',
            }}>
              タップして閉じる
            </div>
          </div>
        </div>
      )}

      <div
        className="flex justify-center items-center py-4"
        style={{ perspective: '900px' }}
      >
        <div
          ref={cardRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            width: 340,
            height: 210,
            borderRadius: 14,
            background: cfg.bg,
            boxShadow: cfg.glow,
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            transformStyle: 'preserve-3d',
            userSelect: 'none',
            overflow: 'hidden',
            touchAction: 'none',
          }}
        >
          {/* ホログラフィックシマーレイヤー */}
          <div
            ref={shimmerRef}
            style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              opacity: 0, transition: 'opacity 0.15s',
              pointerEvents: 'none', zIndex: 5,
            }}
          />

          {/* 細粒ノイズ質感 */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 14,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.11'/%3E%3C/svg%3E")`,
            pointerEvents: 'none', zIndex: 1,
          }} />

          {/* 異方性ブラッシュメタルテクスチャ（横方向） */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 14,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.01 0.85' numOctaves='3' seed='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)' opacity='0.08'/%3E%3C/svg%3E")`,
            pointerEvents: 'none', zIndex: 2,
          }} />

          {/* ビネット（周辺減光・重厚感） */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 14,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 44%, rgba(0,0,0,0.58) 100%)',
            pointerEvents: 'none', zIndex: 3,
          }} />

          {/* 上端リムハイライト（金属エッジ感） */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent 6%, rgba(255,255,255,0.22) 30%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0.22) 70%, transparent 94%)',
            pointerEvents: 'none', zIndex: 4,
          }} />

          {/* カード内コンテンツ */}
          <div style={{ position: 'relative', zIndex: 6, padding: '18px 22px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

            {/* 上段: ブランド名・ランク | 装飾サークル */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.22em', color: cfg.accent, opacity: 0.72, marginBottom: 3 }}>
                  STELLA COIN
                </div>
                <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: '0.18em', color: cfg.accent, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                  {cfg.label}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.accent, opacity: 0.20 }} />
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.accent, opacity: 0.13, marginLeft: -13 }} />
              </div>
            </div>

            {/* 中段: EMVチップ + カード番号 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <svg width="34" height="26" viewBox="0 0 34 26" style={{ flexShrink: 0, opacity: 0.70 }}>
                <rect x="0.5" y="0.5" width="33" height="25" rx="3"
                  fill={cfg.accent} fillOpacity="0.15"
                  stroke={cfg.accent} strokeWidth="0.5" strokeOpacity="0.5" />
                <line x1="0.5" y1="9" x2="33.5" y2="9" stroke={cfg.accent} strokeWidth="0.4" strokeOpacity="0.44" />
                <line x1="0.5" y1="17" x2="33.5" y2="17" stroke={cfg.accent} strokeWidth="0.4" strokeOpacity="0.44" />
                <line x1="11" y1="0.5" x2="11" y2="25.5" stroke={cfg.accent} strokeWidth="0.4" strokeOpacity="0.44" />
                <line x1="23" y1="0.5" x2="23" y2="25.5" stroke={cfg.accent} strokeWidth="0.4" strokeOpacity="0.44" />
              </svg>
              <div style={{ display: 'flex', gap: 10 }}>
                {['••••', '••••', '••••', String(year)].map((seg, i) => (
                  <span key={i} style={{ fontSize: 12, letterSpacing: '0.12em', color: cfg.text, opacity: 0.62, fontFamily: 'monospace' }}>
                    {seg}
                  </span>
                ))}
              </div>
            </div>

            {/* 下段: 名前 | SC */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.20em', color: cfg.text, opacity: 0.50, marginBottom: 2 }}>MEMBER</div>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.07em', color: cfg.text, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  {displayName || 'MEMBER'}
                </div>
              </div>
              <div style={{ fontSize: 10, color: cfg.text, opacity: 0.42, fontStyle: 'italic', letterSpacing: '0.04em' }}>
                SC
              </div>
            </div>
          </div>

          {/* 右上光沢ストリーク */}
          <div style={{
            position: 'absolute', top: -40, right: -20, width: 80, height: 180,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)',
            transform: 'rotate(20deg)', pointerEvents: 'none', zIndex: 4,
          }} />
        </div>
      </div>
    </>
  )
}
