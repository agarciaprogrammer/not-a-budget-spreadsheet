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
    <footer className="bg-gradient-to-r from-indigo-600 to-indigo-400 text-white border-t border-indigo-700 mt-auto shadow-inner">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
        
        <div className="text-sm">
          © 2025 {config.app.name}. 
          <span className="italic ml-1">Please don’t sue us, we’re just vibes.</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span>💸 Not-A-Budget Guarantee™</span>
          <a 
            href="https://github.com/agarciaprogrammer/not-a-budget-spreadsheet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline underline-offset-2"
          >
            Source Code 🧠
          </a>
        </div>
      </div>
    </footer>
  )
}

