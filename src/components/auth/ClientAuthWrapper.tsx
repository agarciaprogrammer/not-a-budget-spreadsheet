'use client'

import dynamic from 'next/dynamic'

const AuthForm = dynamic(() => import('@/components/auth/AuthForm'), {
  ssr: false,
})

export default function ClientAuthWrapper() {
  return <AuthForm />
}
