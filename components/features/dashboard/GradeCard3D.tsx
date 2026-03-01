'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
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
  edgeColor: string
}> = {
  bronze: {
    label: 'BRONZE',
    bg: 'linear-gradient(155deg, #1C0D00 0%, #6B3010 18%, #B86B28 36%, #D48840 50%, #9B5018 65%, #4A1E06 84%, #1A0A00 100%)',
    shimmer: 'rgba(200,120,48,0.45)',
    text: '#FFE8C0',
    accent: '#D9A86A',
    glow: '0 20px 60px rgba(100,40,5,0.95), 0 8px 24px rgba(0,0,0,0.98), 0 2px 6px rgba(180,90,20,0.4)',
    edgeColor: '#6B3010',
  },
  silver: {
    label: 'SILVER',
    bg: 'linear-gradient(155deg, #141414 0%, #3E3E3E 18%, #868686 35%, #C2C2C2 50%, #DADADA 58%, #888888 74%, #3A3A3A 90%, #0F0F0F 100%)',
    shimmer: 'rgba(198,198,198,0.5)',
    text: '#111111',
    accent: '#CECECE',
    glow: '0 20px 60px rgba(40,40,40,0.92), 0 8px 24px rgba(0,0,0,0.98), 0 2px 6px rgba(160,160,160,0.3)',
    edgeColor: '#4A4A4A',
  },
  gold: {
    label: 'GOLD',
    bg: 'linear-gradient(155deg, #150B00 0%, #583800 18%, #AE7E00 35%, #D2A600 50%, #EEC000 58%, #9E7600 74%, #482C00 90%, #150B00 100%)',
    shimmer: 'rgba(238,192,0,0.45)',
    text: '#1A0E00',
    accent: '#EECA40',
    glow: '0 20px 64px rgba(160,118,0,0.95), 0 8px 24px rgba(0,0,0,0.98), 0 2px 6px rgba(238,192,0,0.35)',
    edgeColor: '#7A5800',
  },
  platinum: {
    label: 'PLATINUM',
    bg: 'linear-gradient(155deg, #0C0C0C 0%, #363636 18%, #666666 35%, #B2B2B2 50%, #E6E6E6 58%, #AEAEAE 70%, #464646 88%, #0C0C0C 100%)',
    shimmer: 'rgba(238,238,238,0.6)',
    text: '#080808',
    accent: '#E6E6E6',
    glow: '0 20px 64px rgba(158,158,158,0.9), 0 8px 24px rgba(0,0,0,0.98), 0 2px 6px rgba(220,220,220,0.35)',
    edgeColor: '#5A5A5A',
  },
  diamond: {
    label: 'DIAMOND',
    bg: 'linear-gradient(155deg, #00060E 0%, #001A2E 18%, #003650 35%, #006680 48%, #009EC0 58%, #005E78 70%, #001A2E 88%, #00060E 100%)',
    shimmer: 'rgba(0,178,218,0.5)',
    text: '#C0F0FF',
    accent: '#3ED6F6',
    glow: '0 20px 68px rgba(0,118,178,0.95), 0 8px 24px rgba(0,0,0,0.98), 0 2px 6px rgba(0,178,218,0.35)',
    edgeColor: '#003650',
  },
}

// カードの厚さ (px) — 3D translateZ で「側面」を表現
const CARD_THICKNESS = 8

export default function GradeCard3D({ rank, displayName, memberSince, rankUpKey }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const shimmerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const isHoveredRef = useRef(false)
  const isDraggingRef = useRef(false)
  const rotationRef = useRef({ x: 0, y: 0 })
  const hoverTargetRef = useRef({ x: 0, y: 0 })
  const angularVelocityRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(0)
  const lastFrameRef = useRef(0)
  const animFrameRef = useRef<number>(0)

  const cfg = RANK_CONFIG[rank]
  const clamp = useCallback((value: number, min: number, max: number) => Math.max(min, Math.min(max, value)), [])

  // 統合アニメーションループ
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    lastFrameRef.current = performance.now()

    const applyTransform = () => {
      const rx = rotationRef.current.x
      const ry = rotationRef.current.y
      wrapper.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
    }

    const animate = () => {
      const now = performance.now()
      const dt = Math.min((now - lastFrameRef.current) / 16.6667, 2.5)
      lastFrameRef.current = now

      if (isDraggingRef.current) {
        applyTransform()
        animFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // ゆっくり自動回転の基底速度
      const baseAutoSpinY = 0.12

      if (isHoveredRef.current) {
        // ホバー時: ターゲットへ滑らかに補間 (ぬめぬめ)
        const lerpFactor = 1 - Math.pow(0.86, dt)
        rotationRef.current.x += (hoverTargetRef.current.x - rotationRef.current.x) * lerpFactor
        rotationRef.current.y += (hoverTargetRef.current.y - rotationRef.current.y) * lerpFactor
        angularVelocityRef.current.x *= 0.92
        angularVelocityRef.current.y *= 0.92
      } else {
        // 慣性フェーズ: 摩擦係数 0.995 で非常にゆっくり減速 → 投げ感
        const dragDamping = Math.pow(0.995, dt)
        angularVelocityRef.current.x *= dragDamping
        angularVelocityRef.current.y *= dragDamping

        // 慣性が十分小さくなったら自動回転へ滑らかに遷移
        const speed = Math.sqrt(
          angularVelocityRef.current.x ** 2 + angularVelocityRef.current.y ** 2
        )
        if (speed < 0.5) {
          const blendFactor = 0.02 * dt
          angularVelocityRef.current.y += (baseAutoSpinY - angularVelocityRef.current.y) * blendFactor
          angularVelocityRef.current.x += (0 - angularVelocityRef.current.x) * blendFactor
        }

        rotationRef.current.x += angularVelocityRef.current.x * dt
        rotationRef.current.y += angularVelocityRef.current.y * dt

        rotationRef.current.x = clamp(rotationRef.current.x, -70, 70)
        if (rotationRef.current.y > 360 || rotationRef.current.y < -360) {
          rotationRef.current.y %= 360
        }
      }

      applyTransform()
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [clamp])

  // 昇格アニメーション
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

  useEffect(() => {
    if (!showCelebration) return
    const t = setTimeout(() => setShowCelebration(false), 4500)
    return () => clearTimeout(t)
  }, [showCelebration])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    isHoveredRef.current = false
    setIsDragging(true)
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    lastTimeRef.current = performance.now()
    angularVelocityRef.current = { x: 0, y: 0 }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const wrapper = wrapperRef.current
    const shimmer = shimmerRef.current
    if (!wrapper) return

    if (isDraggingRef.current) {
      const now = performance.now()
      const dt = Math.max(now - lastTimeRef.current, 1)
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y

      // 速度を蓄積（投げの感度を高く）
      angularVelocityRef.current = {
        x: clamp(-(dy / dt) * 10, -14, 14),
        y: clamp((dx / dt) * 10, -14, 14),
      }

      rotationRef.current.y += dx * 0.6
      rotationRef.current.x -= dy * 0.6
      rotationRef.current.x = clamp(rotationRef.current.x, -70, 70)

      lastPosRef.current = { x: e.clientX, y: e.clientY }
      lastTimeRef.current = now
    } else if (isHoveredRef.current) {
      const rect = wrapper.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      const rotX = -(dy / (rect.height / 2)) * 25
      const rotY = (dx / (rect.width / 2)) * 25
      hoverTargetRef.current = { x: rotX, y: rotY }
    }

    if (shimmer) {
      const card = cardRef.current
      if (card) {
        const rect = card.getBoundingClientRect()
        const pctX = ((e.clientX - rect.left) / rect.width) * 100
        const pctY = ((e.clientY - rect.top) / rect.height) * 100
        shimmer.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${cfg.shimmer} 0%, transparent 55%)`
        shimmer.style.opacity = '1'
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      ;(e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
    } catch { /* noop */ }

    // 投げブースト: リリース時に速度を増幅してスピン感を出す
    const spinBoost = 1.6
    angularVelocityRef.current.x = clamp(angularVelocityRef.current.x * spinBoost, -18, 18)
    angularVelocityRef.current.y = clamp(angularVelocityRef.current.y * spinBoost, -18, 18)
  }

  const handleMouseEnter = () => {
    isHoveredRef.current = true
  }

  const handleMouseLeave = () => {
    if (!isDraggingRef.current) {
      isHoveredRef.current = false
      hoverTargetRef.current = { x: 0, y: 0 }
      const shimmer = shimmerRef.current
      if (shimmer) shimmer.style.opacity = '0'
    }
  }

  const year = memberSince ? new Date(memberSince).getFullYear() : new Date().getFullYear()

  // 側面レイヤーを生成（カードの厚みを視覚化）
  const edgeLayers = []
  for (let i = 0; i < CARD_THICKNESS; i++) {
    edgeLayers.push(
      <div
        key={`edge-${i}`}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          background: cfg.edgeColor,
          transform: `translateZ(${-i - 1}px)`,
          pointerEvents: 'none',
          ...(i === CARD_THICKNESS - 1 ? {
            boxShadow: `0 24px 48px rgba(0,0,0,0.7), 0 8px 16px rgba(0,0,0,0.5)`,
          } : {}),
        }}
      />
    )
  }

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
        className="flex justify-center items-center py-6"
        style={{ perspective: '1400px' }}
      >
        {/* 3D回転ラッパー（カード全体＋側面が一体で回転） */}
        <div
          ref={wrapperRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            width: 340,
            height: 210,
            position: 'relative',
            transformStyle: 'preserve-3d',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            willChange: 'transform',
          }}
        >
          {/* 側面レイヤー（カード厚み） */}
          {edgeLayers}

          {/* 背面（裏） */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 14,
            background: `linear-gradient(160deg, rgba(0,0,0,0.85), rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.8) 100%)`,
            transform: `translateZ(${-CARD_THICKNESS}px) rotateY(180deg)`,
            backfaceVisibility: 'hidden',
            pointerEvents: 'none',
          }} />

          {/* メインカード前面 */}
          <div
            ref={cardRef}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 14,
              background: cfg.bg,
              border: '1.5px solid rgba(255,255,255,0.18)',
              boxShadow: cfg.glow,
              overflow: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          >
            {/* ホログラフィックシマーレイヤー */}
            <div
              ref={shimmerRef}
              style={{
                position: 'absolute', inset: 0, borderRadius: 14,
                opacity: 0, transition: 'opacity 0.2s ease-out',
                pointerEvents: 'none', zIndex: 8,
                mixBlendMode: 'overlay',
              }}
            />

            {/* ノイズテクスチャ（粗い金属粒感） */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E")`,
              pointerEvents: 'none', zIndex: 1,
            }} />

            {/* ブラッシュメタルテクスチャ（横方向ヘアライン） */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.008 0.9' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)' opacity='0.1'/%3E%3C/svg%3E")`,
              pointerEvents: 'none', zIndex: 2,
            }} />

            {/* ディープビネット（重厚な周辺減光） */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              background: 'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.65) 100%)',
              pointerEvents: 'none', zIndex: 3,
            }} />

            {/* インナーシャドウ（凹み感・重量感） */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.55), inset 0 -1px 4px rgba(0,0,0,0.35)',
              pointerEvents: 'none', zIndex: 4,
            }} />

            {/* 上端リムハイライト（金属エッジ＝ゴツゴツ感） */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent 4%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.18) 80%, transparent 96%)',
              pointerEvents: 'none', zIndex: 5,
            }} />

            {/* 下端シャドウライン（厚み感） */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent 8%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 70%, transparent 92%)',
              pointerEvents: 'none', zIndex: 5,
            }} />

            {/* 左端エッジハイライト */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
              background: 'linear-gradient(180deg, transparent 6%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 70%, transparent 94%)',
              pointerEvents: 'none', zIndex: 5,
            }} />

            {/* 右端シャドウ */}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 2,
              background: 'linear-gradient(180deg, transparent 6%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.25) 70%, transparent 94%)',
              pointerEvents: 'none', zIndex: 5,
            }} />

            {/* カード内コンテンツ */}
            <div style={{ position: 'relative', zIndex: 6, padding: '18px 22px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

              {/* 上段: ブランド名・ランク | 装飾サークル */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{
                    fontSize: 10, letterSpacing: '0.22em', color: cfg.accent, opacity: 0.72, marginBottom: 3,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}>
                    STELLA COIN
                  </div>
                  <div style={{
                    fontSize: 22, fontWeight: 900, letterSpacing: '0.18em', color: cfg.accent,
                    textShadow: `0 2px 8px rgba(0,0,0,0.7), 0 0 1px ${cfg.accent}`,
                  }}>
                    {cfg.label}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.accent, opacity: 0.22, boxShadow: `inset 0 1px 3px rgba(0,0,0,0.3)` }} />
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.accent, opacity: 0.14, marginLeft: -13, boxShadow: `inset 0 1px 3px rgba(0,0,0,0.3)` }} />
                </div>
              </div>

              {/* 中段: EMVチップ + カード番号 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <svg width="36" height="28" viewBox="0 0 36 28" style={{ flexShrink: 0 }}>
                  {/* チップ外枠 — 凸エンボス感 */}
                  <defs>
                    <linearGradient id="chipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cfg.accent} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={cfg.accent} stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  <rect x="0.5" y="0.5" width="35" height="27" rx="3.5"
                    fill="url(#chipGrad)"
                    stroke={cfg.accent} strokeWidth="0.8" strokeOpacity="0.6" />
                  {/* チップ内回路パターン */}
                  <line x1="0.5" y1="9.5" x2="35.5" y2="9.5" stroke={cfg.accent} strokeWidth="0.5" strokeOpacity="0.5" />
                  <line x1="0.5" y1="18.5" x2="35.5" y2="18.5" stroke={cfg.accent} strokeWidth="0.5" strokeOpacity="0.5" />
                  <line x1="12" y1="0.5" x2="12" y2="27.5" stroke={cfg.accent} strokeWidth="0.5" strokeOpacity="0.5" />
                  <line x1="24" y1="0.5" x2="24" y2="27.5" stroke={cfg.accent} strokeWidth="0.5" strokeOpacity="0.5" />
                  {/* 中央ハイライト */}
                  <rect x="13" y="10.5" width="10" height="7" rx="1" fill={cfg.accent} fillOpacity="0.08" />
                </svg>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['••••', '••••', '••••', String(year)].map((seg, i) => (
                    <span key={i} style={{
                      fontSize: 12, letterSpacing: '0.12em', color: cfg.text, opacity: 0.62,
                      fontFamily: 'monospace',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}>
                      {seg}
                    </span>
                  ))}
                </div>
              </div>

              {/* 下段: 名前 | SC */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{
                    fontSize: 8, letterSpacing: '0.20em', color: cfg.text, opacity: 0.50, marginBottom: 2,
                    textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                  }}>
                    MEMBER
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700, letterSpacing: '0.07em', color: cfg.text,
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}>
                    {displayName || 'MEMBER'}
                  </div>
                </div>
                <div style={{
                  fontSize: 10, color: cfg.text, opacity: 0.42, fontStyle: 'italic', letterSpacing: '0.04em',
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                }}>
                  SC
                </div>
              </div>
            </div>

            {/* 右上光沢ストリーク */}
            <div style={{
              position: 'absolute', top: -40, right: -20, width: 80, height: 180,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), transparent)',
              transform: 'rotate(20deg)', pointerEvents: 'none', zIndex: 7,
            }} />
          </div>
        </div>
      </div>
    </>
  )
}
