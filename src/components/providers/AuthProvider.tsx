'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuthentication } from '@/hooks/useAuthentication'

type AuthContextType = ReturnType<typeof useAuthentication>

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const auth = useAuthentication()

  useEffect(() => {
    setMounted(true)
  }, [])

  // No renderizar nada hasta que estemos montados en el cliente
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

