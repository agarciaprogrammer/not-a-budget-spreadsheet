'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsername() {
      if (user) {
        const res = await fetch(`/api/profile?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setUsername(data.username)
        }
      }
    }
    fetchUsername()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-lg">Loading dashboard...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-red-500 text-lg">You must be logged in to view the dashboard.</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome{username ? `, ${username}` : ''}!</h1>
        <p className="mb-6 text-gray-600">This is your budget dashboard. (Pie chart and transactions coming soon.)</p>
        <div className="border rounded-lg p-4 mb-4 bg-gray-100 text-center">
          <span className="text-gray-400">[Pie chart placeholder]</span>
        </div>
        <div className="border rounded-lg p-4 bg-gray-100 text-center">
          <span className="text-gray-400">[Recent transactions placeholder]</span>
        </div>
      </div>
    </div>
  )
}
