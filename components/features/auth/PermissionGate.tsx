'use client'

import { useEffect, useState, ReactNode } from 'react'

interface PermissionGateProps {
  children: ReactNode
  category: string
  action: string
  fallback?: ReactNode
}

export default function PermissionGate({
  children,
  category,
  action,
  fallback = null
}: PermissionGateProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkPermissions() {
      try {
        const response = await fetch('/api/auth/permissions')
        if (!response.ok) {
          setHasPermission(false)
          return
        }

        const data = await response.json()
        const permissions = data.permissions

        if (!permissions || !permissions[category]) {
          setHasPermission(false)
          return
        }

        setHasPermission(permissions[category][action] === true)
      } catch {
        setHasPermission(false)
      }
    }

    checkPermissions()
  }, [category, action])

  if (hasPermission === null) {
    return null // ローディング中
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
