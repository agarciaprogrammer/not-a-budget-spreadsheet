import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { config } from '@/lib/config/app.config'
import UnconventionalNavbar from '@/components/UnconventionalNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.app.name,
  description: 'Financial Operating System — Personal finance command center.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        <ErrorBoundary>
          <I18nProvider locale="en">
            <AuthProvider>
              <div style={{ display: 'flex', minHeight: '100vh' }}>
                <UnconventionalNavbar />
                {/* Offset for sidebar on desktop, top bar on mobile */}
                <div style={{ flex: 1, paddingLeft: 0, paddingTop: 0 }} className="md:ml-14 pt-11 md:pt-0">
                  <main style={{ flex: 1 }}>
                    {children}
                  </main>
                </div>
              </div>
            </AuthProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
