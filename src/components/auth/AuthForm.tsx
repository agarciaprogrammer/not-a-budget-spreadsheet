'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTranslation } from '@/hooks/useTranslation'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [verifyEmail, setVerifyEmail] = useState(false)
  const { signIn, signUp, error: contextError } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    
    try {
      if (isLogin) {
        await signIn(username, password)
      } else {
        const needsVerification = await signUp(username, email, password)
        if (needsVerification) {
          setVerifyEmail(true)
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('auth.error.occurred'))
      console.error('"AuthForm" error:', err)
    }
  }

  if (verifyEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {t('auth.verify.email.title')}
          </h2>
          <p className="text-center text-gray-600">
            {t('auth.verify.email.message')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? t('auth.welcome.back') : t('auth.create.account')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(localError || contextError) && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{localError || contextError}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.username.placeholder')}
                pattern="[a-zA-Z0-9_]{3,}"
                title={t('auth.username.validation')}
              />
            </div>
            {!isLogin && (
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.email.placeholder')}
                />
              </div>
            )}
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password.placeholder')}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              {isLogin ? t('auth.sign.in') : t('auth.sign.up')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-600 hover:text-indigo-500 cursor-pointer"
            >
              {isLogin
                ? t('auth.no.account.signup')
                : t('auth.have.account.signin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
