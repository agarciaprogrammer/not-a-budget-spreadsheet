import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { budgetService } from './budget.service'
import { transactionSchema, type TransactionFormData } from '@/validations/transaction'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'

const CATEGORY_COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
]

export interface Transaction {
  id: string
  budget_id: string
  user_id: string
  category_id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  description: string | null
  created_at: string
  categories?: { // Added for join results
    name: string
  }
}

export interface Category {
  id: string
  name: string
}

export class TransactionService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('TransactionService must be used in browser environment')
    }
    return createBrowserSupabaseClient()
  }

  async createTransaction(userId: string, transactionData: Partial<TransactionFormData>): Promise<Transaction> {
    const validatedData = transactionSchema.parse({
      ...transactionData,
      amount: Number(transactionData.amount),
      date: transactionData.date,
    })
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      throw new Error('No se encontró el presupuesto del usuario')
    }
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        budget_id: budgetId,
        user_id: userId,
        category_id: validatedData.category_id,
        type: validatedData.type,
        amount: validatedData.amount,
        date: validatedData.date,
        description: validatedData.description || null,
      })
      .select()
      .single()
    if (error) throw error
    return data as Transaction
  }

  async getUserTransactions(userId: string, limit?: number, dateRange?: { startDate: string; endDate: string }): Promise<Transaction[]> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return []
    }
    const supabase = this.getSupabaseClient()
    let query = supabase
      .from('transactions')
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        date,
        description,
        created_at,
        categories!inner (
          name
        )
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    if (dateRange) {
      query = query
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
    }
    
    if (limit) {
      query = query.limit(limit)
    }
    const { data, error } = await query
    if (error) throw error
    return data as unknown as Transaction[]
  }

  async deleteTransaction(transactionId: string, userId: string): Promise<void> {
    const supabase = this.getSupabaseClient()
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId)
    if (error) throw error
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .order('name')
    if (error) throw error
    return data || []
  }

  async getTransactionSummary(userId: string, dateRange?: { startDate: string; endDate: string }): Promise<{
    totalIncome: number
    totalExpenses: number
    netBalance: number
  }> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
    }
    const supabase = this.getSupabaseClient()
    let query = supabase
      .from('transactions')
      .select('type, amount')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
    
    if (dateRange) {
      query = query
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
    }
    
    const { data: transactions, error } = await query
    if (error) throw error
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const totalExpenses = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const netBalance = totalIncome - totalExpenses
    return {
      totalIncome,
      totalExpenses,
      netBalance
    }
  }

  async getCategoryBreakdown(userId: string, dateRange?: { startDate: string; endDate: string }): Promise<{
    categories: Array<{
      name: string
      value: number
      percentage: number
      color: string
    }>
    totalAmount: number
    topCategoriesCount: number
  }> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return { categories: [], totalAmount: 0, topCategoriesCount: 0 }
    }

    const supabase = this.getSupabaseClient()
    
    // Use provided date range or default to current month
    const startDate = dateRange?.startDate || formatDateToYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const endDate = dateRange?.endDate || formatDateToYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))

    // Fetch expenses grouped by category for specified period
    const { data: categoryData, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        categories!inner (
          name
        )
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error

    // Group and sum by category
    const categoryTotals = new Map<string, number>()
    let totalAmount = 0

    categoryData?.forEach((transaction: { amount: number; categories: { name: string }[] }) => {
      const categoryName = transaction.categories[0]?.name || 'Unknown'
      const amount = Number(transaction.amount)
      categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + amount)
      totalAmount += amount
    })

    // Convert to array and sort by amount (descending)
    const sortedCategories = Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Take top 5 categories and group the rest as "Other"
    const topCategories = sortedCategories.slice(0, 5)
    const otherCategories = sortedCategories.slice(5)
    
    const categories = topCategories.map((category, index) => ({
      name: category.name,
      value: category.value,
      percentage: totalAmount > 0 ? (category.value / totalAmount) * 100 : 0,
      color: CATEGORY_COLORS[index] || CATEGORY_COLORS[0]
    }))

    // Add "Other" category if there are remaining categories
    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.value, 0)
      categories.push({
        name: 'Other',
        value: otherTotal,
        percentage: totalAmount > 0 ? (otherTotal / totalAmount) * 100 : 0,
        color: CATEGORY_COLORS[5] || '#6B7280' // gray-500
      })
    }

    return {
      categories,
      totalAmount,
      topCategoriesCount: topCategories.length
    }
  }

  async getIncomeExpenseHistory(userId: string, monthsBack: number = 6): Promise<Array<{
    month: string
    income: number
    expense: number
  }>> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return []
    }

    const supabase = this.getSupabaseClient()
    
    // Calculate date range for the last N months
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - monthsBack + 1)
    startDate.setDate(1)

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .gte('date', formatDateToYYYYMMDD(startDate))
      .lte('date', formatDateToYYYYMMDD(endDate))
      .order('date', { ascending: true })

    if (error) throw error

    // Group by month and calculate totals
    const monthlyData = new Map<string, { income: number; expense: number }>()
    
    transactions?.forEach(transaction => {
      // Parse YYYY-MM-DD as local date to avoid timezone issues
      const [year, month, day] = transaction.date.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0 })
      }
      
      const monthData = monthlyData.get(monthKey)!
      if (transaction.type === 'income') {
        monthData.income += Number(transaction.amount)
      } else {
        monthData.expense += Number(transaction.amount)
      }
    })

    // Convert to array and sort by month
    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  async getSpendingByDayOfWeek(userId: string, dateRange: { startDate: string; endDate: string }): Promise<Array<{
    dayOfWeek: string
    totalSpent: number
    dayIndex: number
    date: string
  }>> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) return []
  
    const supabase = this.getSupabaseClient()
  
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, date')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)
  
    if (error) throw error
  
    // Group by date
    const dateTotals = new Map<string, number>()
    transactions?.forEach(transaction => {
      const currentTotal = dateTotals.get(transaction.date) || 0
      dateTotals.set(transaction.date, currentTotal + Number(transaction.amount))
    })
  
    // Get last 7 days including today
    const sevenDaysData: Array<{
      dayOfWeek: string
      totalSpent: number
      dayIndex: number
      date: string
    }> = []
  
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      
      const dateKey = formatDateToYYYYMMDD(d)
      sevenDaysData.push({
        dayOfWeek: dayNames[d.getDay()],
        totalSpent: dateTotals.get(dateKey) || 0,
        dayIndex: 6 - i,
        date: dateKey
      })
    }
  
    return sevenDaysData
  }
}

export const transactionService = new TransactionService() 