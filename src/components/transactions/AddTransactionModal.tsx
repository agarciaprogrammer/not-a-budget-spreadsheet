'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { transactionSchema, type TransactionFormData } from '@/validations/transaction'
import { useAuth } from '@/components/providers/AuthProvider'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onTransactionAdded: () => void
}

interface Category {
  id: string
  name: string
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onTransactionAdded 
}: AddTransactionModalProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<TransactionFormData>>({
    type: 'expense',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const supabase = createBrowserSupabaseClient()

  const loadCategories = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error

      // Agregar categoría "Other" por defecto si no existe
      const defaultCategories = [
        { id: 'other', name: 'Other' },
        ...(data || [])
      ]
      setCategories(defaultCategories)
      
      // Establecer "Other" como categoría por defecto
      if (!formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: 'other' }))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [user, supabase, formData.category_id])

  useEffect(() => {
    if (isOpen && user) {
      loadCategories()
    }
  }, [isOpen, user, loadCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Validar datos con Zod
      const validatedData = transactionSchema.parse({
        ...formData,
        amount: Number(formData.amount),
        date: new Date(formData.date!).toISOString(),
      })

      // Obtener el budget_id del usuario
      const { data: budgetUser, error: budgetError } = await supabase
        .from('budget_users')
        .select('budget_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (budgetError || !budgetUser) {
        throw new Error('No se encontró el presupuesto del usuario')
      }

      // Insertar transacción
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          budget_id: budgetUser.budget_id,
          user_id: user.id,
          category_id: validatedData.category_id,
          type: validatedData.type,
          amount: validatedData.amount,
          date: validatedData.date,
          description: validatedData.description || null,
        })

      if (insertError) throw insertError

      // Limpiar formulario y cerrar modal
      setFormData({
        type: 'expense',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
      onTransactionAdded()
      onClose()
    } catch (error) {
      console.error('Error adding transaction:', error)
      setError(error instanceof Error ? error.message : 'Error al agregar transacción')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 border border-gray-200 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-indigo-600">Add Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de transacción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center text-gray-700">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                  className="mr-2"
                />
                Expense
              </label>
              <label className="flex items-center text-gray-700">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                  className="mr-2"
                />
                Income
              </label>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Food, Transport, etc."
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 