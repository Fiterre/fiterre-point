'use client'

import { useRef, useEffect, useState } from 'react'
import type { MemberRank } from '@/types/database'

interface Props {
  rank: MemberRank
  displayName: string | null
  memberSince?: string
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
    bg: 'linear-gradient(135deg, #6B3A1F 0%, #CD7F32 45%, #DAA520 70%, #8B4513 100%)',
    shimmer: 'rgba(218,165,32,0.35)',
    text: '#FFF8E7',
    accent: '#FFD580',
    glow: '0 0 32px 6px rgba(205,127,50,0.45)',
  },
  silver: {
    label: 'SILVER',
    bg: 'linear-gradient(135deg, #5A5A5A 0%, #C0C0C0 45%, #E8E8E8 70%, #808080 100%)',
    shimmer: 'rgba(232,232,232,0.4)',
    text: '#1A1A1A',
    accent: '#FFFFFF',
    glow: '0 0 32px 6px rgba(192,192,192,0.5)',
  },
  gold: {
    label: 'GOLD',
    bg: 'linear-gradient(135deg, #7B5800 0%, #FFD700 45%, #FFF176 70%, #B8860B 100%)',
    shimmer: 'rgba(255,241,118,0.45)',
    text: '#2A1A00',
    accent: '#FFFDE0',
    glow: '0 0 40px 8px rgba(255,215,0,0.55)',
  },
  platinum: {
    label: 'PLATINUM',
    bg: 'linear-gradient(135deg, #7A7A7A 0%, #D8D8D8 40%, #FFFFFF 60%, #9E9E9E 100%)',
    shimmer: 'rgba(255,255,255,0.5)',
    text: '#1A1A1A',
    accent: '#FFFFFF',
    glow: '0 0 40px 8px rgba(220,220,220,0.6)',
  },
  diamond: {
    label: 'DIAMOND',
    bg: 'linear-gradient(135deg, #006064 0%, #00BCD4 35%, #B9F2FF 60%, #00ACC1 100%)',
    shimmer: 'rgba(185,242,255,0.5)',
    text: '#001A2E',
    accent: '#E0FBFF',
    glow: '0 0 48px 10px rgba(0,188,212,0.6)',
  },
}

export default function GradeCard3D({ rank, displayName, memberSince }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const shimmerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const animFrameRef = useRef<number>(0)
  const autoAngleRef = useRef(0)

  const cfg = RANK_CONFIG[rank]

  // 自動回転（ホバー中は停止）
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const animate = () => {
      if (!isHovered) {
        autoAngleRef.current = (autoAngleRef.current + 0.3) % 360
        const y = autoAngleRef.current
        const x = Math.sin((y * Math.PI) / 180) * 8
        card.style.transform = `rotateY(${y % 60 - 30}deg) rotateX(${x}deg)`
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isHovered])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    const shimmer = shimmerRef.current
    if (!card || !shimmer) return

    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const rotX = -(dy / (rect.height / 2)) * 25
    const rotY = (dx / (rect.width / 2)) * 25

    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`

    // ホログラフィックシマー
    const pctX = ((e.clientX - rect.left) / rect.width) * 100
    const pctY = ((e.clientY - rect.top) / rect.height) * 100
    shimmer.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, ${cfg.shimmer} 0%, transparent 60%)`
    shimmer.style.opacity = '1'
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    const shimmer = shimmerRef.current
    if (shimmer) shimmer.style.opacity = '0'
  }

  const year = memberSince ? new Date(memberSince).getFullYear() : new Date().getFullYear()

  return (
    <div
      className="flex justify-center items-center py-4"
      style={{ perspective: '900px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          width: 340,
          height: 200,
          borderRadius: 16,
          background: cfg.bg,
          boxShadow: cfg.glow,
          position: 'relative',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'none' : 'transform 0.05s linear',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* ホログラフィックシマーレイヤー */}
        <div
          ref={shimmerRef}
          style={{
            position: 'absolute', inset: 0, borderRadius: 16,
            opacity: 0, transition: 'opacity 0.15s',
            pointerEvents: 'none', zIndex: 2,
          }}
        />

        {/* ノイズ質感レイヤー */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* カード内コンテンツ */}
        <div style={{ position: 'relative', zIndex: 3, padding: '20px 24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* ランクロゴ + ラベル */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', color: cfg.accent, opacity: 0.8 }}>
                STELLA COIN
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.15em', color: cfg.accent, textShadow: `0 1px 4px rgba(0,0,0,0.3)` }}>
                {cfg.label}
              </div>
            </div>
            {/* 装飾円 */}
            <div style={{ display: 'flex', gap: -8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.accent, opacity: 0.25 }} />
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.accent, opacity: 0.15, marginLeft: -16 }} />
            </div>
          </div>

          {/* 中段: カード番号風デコレーション */}
          <div style={{ display: 'flex', gap: 12 }}>
            {['••••', '••••', '••••', String(year)].map((seg, i) => (
              <span key={i} style={{ fontSize: 14, letterSpacing: '0.12em', color: cfg.text, opacity: 0.7, fontFamily: 'monospace' }}>
                {seg}
              </span>
            ))}
          </div>

          {/* 下段: 名前 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.15em', color: cfg.text, opacity: 0.6 }}>MEMBER</div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', color: cfg.text, textShadow: `0 1px 3px rgba(0,0,0,0.2)` }}>
                {displayName || 'MEMBER'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: cfg.text, opacity: 0.5, fontStyle: 'italic' }}>
              SC
            </div>
          </div>
        </div>

        {/* 右上光沢ストリーク */}
        <div style={{
          position: 'absolute', top: -40, right: -20, width: 80, height: 160,
          background: `linear-gradient(135deg, ${cfg.accent}22, transparent)`,
          transform: 'rotate(20deg)', pointerEvents: 'none', zIndex: 2,
        }} />
      </div>
    </div>
  )
}
