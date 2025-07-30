import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { config } from '@/lib/config/app.config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.app.name,
  description: 'A modern budget tracking application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <UnconventionalNavbar />
              <main className="flex-1">
                {children}
              </main>
              <UnconventionalFooter />
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

function UnconventionalNavbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {config.app.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="/auth"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Auth
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

function UnconventionalFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            © 2024 {config.app.name}. All rights reserved.
          </div>
          <div className="text-sm text-gray-500">
            v{config.app.version}
          </div>
        </div>
      </div>
    </footer>
  )
}
