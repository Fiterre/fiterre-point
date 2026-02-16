'use client'

import { useState, useEffect } from 'react'
import { TierPermissions } from '@/types/database'

interface UserPermissionData {
  userId: string
  email: string
  role: string
  tier: {
    tier_level: number
    tier_name: string
  } | null
  permissions: TierPermissions | null
}

export function usePermissions() {
  const [data, setData] = useState<UserPermissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const response = await fetch('/api/auth/permissions')
        if (!response.ok) {
          throw new Error('権限の取得に失敗しました')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー')
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  const can = (category: keyof TierPermissions, action: string): boolean => {
    if (!data?.permissions) return false
    const categoryPerms = data.permissions[category] as Record<string, boolean>
    return categoryPerms?.[action] === true
  }

  const hasTier = (maxTier: number): boolean => {
    if (!data?.tier) {
      // Tierがない場合はroleで判断
      if (data?.role === 'admin') return true
      if (data?.role === 'manager') return maxTier >= 2
      return false
    }
    return data.tier.tier_level <= maxTier
  }

  return {
    data,
    loading,
    error,
    can,
    hasTier,
    isAdmin: data?.role === 'admin',
    isManager: data?.role === 'manager' || data?.role === 'admin',
    isMentor: data?.role === 'mentor' || data?.role === 'manager' || data?.role === 'admin',
  }
}
