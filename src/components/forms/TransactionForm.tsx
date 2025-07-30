'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { transactionService, type Category } from '@/lib/services/transaction.service'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'

export interface TransactionFormData {
  type: 'income' | 'expense'
  amount: number
  date: string
  category_id: string
  description: string
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  initialData?: Partial<TransactionFormData>
}

export function TransactionForm({ 
  onSubmit, 
  onCancel, 
  loading = false,
  initialData 
}: TransactionFormProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    date: formatDateToYYYYMMDD(new Date()),
    category_id: '',
    description: '',
    ...initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return
      
      try {
        const categories = await transactionService.getUserCategories(user.id)
        setCategories(categories)
        
        // Establecer la primera categoría como seleccionada por defecto si existe
        if (categories.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: categories[0].id }))
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    loadCategories()
  }, [user, formData.category_id])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const categoryOptions: SelectOption[] = categories.map(category => ({
    value: category.id,
    label: category.name
  }))

  return (
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

      {/* Descripción */}
      <Input
        label="Description"
        type="text"
        value={formData.description || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Ej: Food, Transport, etc."
      />

      {/* Fecha */}
      <Input
        label="Date"
        type="date"
        value={formData.date || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        error={errors.date}
        required
      />

      {/* Categoría */}
      <Select
        label="Category"
        options={categoryOptions}
        value={formData.category_id || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
        error={errors.category_id}
        placeholder="Select a category"
        required
      />

      {/* Monto */}
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        value={formData.amount || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
        error={errors.amount}
        required
      />

      {/* Botones */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </form>
  )
} 