import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { config } from '@/lib/config/app.config'
import UnconventionalNavbar from '@/components/UnconventionalNavbar'

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
            <div className="min-h-screen bg-gray-50 flex">
              <UnconventionalNavbar />
              <div className="flex-1 ml-16">
                <main className="flex-1">
                  {children}
                </main>
                <UnconventionalFooter />
              </div>
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
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
