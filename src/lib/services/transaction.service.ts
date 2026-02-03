import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { budgetService } from './budget.service'
import { transactionSchema, type TransactionFormData } from '@/validations/transaction'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import { EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS } from '@/lib/constants'

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

// Define a proper type for transactions with joined categories
interface TransactionWithCategoryRow {
  amount: string | number
  category_id: string
  category: { name: string } | null
  date: string
  expense_kind: 'fixed' | 'variable' | null
}

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
  expense_kind?: 'fixed' | 'variable' | null
  // categories returns as an array from Supabase join
  categories?: { name: string }[]
}

export interface Category {
  id: string
  name: string
  expense_kind?: 'fixed' | 'variable' | null
}

const isLegacyExpense = (date: string) => date < EXPENSE_KIND_REQUIRED_FROM

const isVariableExpense = (date: string, expenseKind: string | null | undefined) =>
  isLegacyExpense(date) || expenseKind === EXPENSE_KINDS.VARIABLE

const isFixedExpense = (date: string, expenseKind: string | null | undefined) =>
  !isLegacyExpense(date) && expenseKind === EXPENSE_KINDS.FIXED

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
        expense_kind: validatedData.type === 'expense' ? validatedData.expense_kind ?? null : null,
      })
      .select()
      .single()
    if (error) throw error
    return data as Transaction
  }

  async getUserTransactions(
    userId: string, 
    options?: {
      page?: number
      pageSize?: number
      dateRange?: { startDate: string; endDate: string }
      categoryId?: string
      type?: 'income' | 'expense'
      search?: string
    }
  ): Promise<{ data: Transaction[]; total: number }> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return { data: [], total: 0 }
    }

    const {
      page = 1,
      pageSize = 10,
      dateRange,
      categoryId,
      type,
      search
    } = options || {}

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
        expense_kind,
        created_at,
        categories!inner (
          name
        )
      `, { count: 'exact' })
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
    
    // Apply filters
    if (dateRange) {
      query = query
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (search) {
      query = query.ilike('description', `%${search}%`)
    }

    // Calculate pagination range
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await query.range(from, to)
    
    if (error) throw error
    
    return {
      data: data as unknown as Transaction[],
      total: count ?? 0
    }
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

  async updateTransaction(
    transactionId: string,
    userId: string,
    transactionData: Partial<TransactionFormData>
  ): Promise<Transaction> {
    const validatedData = transactionSchema.parse({
      ...transactionData,
      amount: Number(transactionData.amount),
      date: transactionData.date,
    })
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('transactions')
      .update({
        category_id: validatedData.category_id,
        type: validatedData.type,
        amount: validatedData.amount,
        date: validatedData.date,
        description: validatedData.description || null,
        expense_kind: validatedData.type === 'expense' ? validatedData.expense_kind ?? null : null,
      })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data as Transaction
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, expense_kind')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data || []
  }

  async getTransactionSummary(
    userId: string,
    options?: { dateRange?: { startDate: string; endDate: string } }
  ): Promise<{
    totalIncome: number
    totalFixedExpenses: number
    totalVariableExpenses: number
    totalExpenses: number
    netBalance: number
  }> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return { totalIncome: 0, totalFixedExpenses: 0, totalVariableExpenses: 0, totalExpenses: 0, netBalance: 0 }
    }
    const supabase = this.getSupabaseClient()
    let query = supabase
      .from('transactions')
      .select('type, amount, date, expense_kind')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
    
    if (options?.dateRange) {
      query = query
        .gte('date', options.dateRange.startDate)
        .lte('date', options.dateRange.endDate)
    }
    
    const { data: transactions, error } = await query
    if (error) throw error
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const totalFixedExpenses = (transactions || [])
      .filter(t => t.type === 'expense' && isFixedExpense(t.date, t.expense_kind))
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const totalVariableExpenses = (transactions || [])
      .filter(t => t.type === 'expense' && isVariableExpense(t.date, t.expense_kind))
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    const totalExpenses = totalFixedExpenses + totalVariableExpenses
    const netBalance = totalIncome - totalExpenses
    return {
      totalIncome,
      totalFixedExpenses,
      totalVariableExpenses,
      totalExpenses,
      netBalance
    }
  }


  async getCategoryBreakdown(
    userId: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<{
    categories: Array<{ name: string; value: number; percentage: number; color: string }>
    totalAmount: number
    topCategoriesCount: number
  }> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) {
      return { categories: [], totalAmount: 0, topCategoriesCount: 0 }
    }
  
    const supabase = this.getSupabaseClient()
  
    // Determine date range
    const startDate =
      dateRange?.startDate ||
      formatDateToYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const endDate =
      dateRange?.endDate ||
      formatDateToYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
  
    // Fetch expenses with aliased category join (no generics on select)
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        category_id,
        date,
        expense_kind,
        category:categories (
          name
        )
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate)
  
    if (error) throw error
  
    // Cast data to the correct type array
    const categoryData = (data as unknown as TransactionWithCategoryRow[]) || []
    const filteredCategoryData = categoryData.filter((tx) =>
      isVariableExpense(tx.date, tx.expense_kind)
    )
  
    // Group and sum by category
    const categoryTotals = new Map<string, number>()
    let totalAmount = 0
  
    filteredCategoryData.forEach((tx: TransactionWithCategoryRow) => {
      const categoryName = tx.category?.name ?? 'Unknown'
      const amount = Number(tx.amount)
      categoryTotals.set(
        categoryName,
        (categoryTotals.get(categoryName) || 0) + amount
      )
      totalAmount += amount
    })
  
    // Convert to array and sort
    const sortedCategories = Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  
    // Top 5 + "Other"
    const topCategories = sortedCategories.slice(0, 5)
    const otherCategories = sortedCategories.slice(5)
  
    const categories = topCategories.map((category, index) => ({
      name: category.name,
      value: category.value,
      percentage: totalAmount > 0 ? (category.value / totalAmount) * 100 : 0,
      color: CATEGORY_COLORS[index] || CATEGORY_COLORS[0]
    }))
  
    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.value, 0)
      categories.push({
        name: 'Other',
        value: otherTotal,
        percentage: totalAmount > 0 ? (otherTotal / totalAmount) * 100 : 0,
        color: CATEGORY_COLORS[5] || '#6B7280'
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
      .select('type, amount, date, expense_kind')
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
      } else if (isVariableExpense(transaction.date, transaction.expense_kind)) {
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
      .select('amount, date, expense_kind')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)
  
    if (error) throw error
  
    // Group by date
    const dateTotals = new Map<string, number>()
    transactions?.forEach(transaction => {
      if (!isVariableExpense(transaction.date, transaction.expense_kind)) {
        return
      }
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

  async getWeeklySpending(userId: string, dateRange: { startDate: string; endDate: string }): Promise<Array<{
    week_start: string
    total_spent: number
  }>> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) return []
  
    const supabase = this.getSupabaseClient()
  
    // Fetch all expenses in the date range
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, date, expense_kind')
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)
  
    if (error) throw error
  
    // Group by week and calculate totals
    const weeklyTotals = new Map<string, number>()
    
    transactions?.forEach(transaction => {
      if (!isVariableExpense(transaction.date, transaction.expense_kind)) {
        return
      }
      // Parse the date and get the start of the week (Sunday)
      const [year, month, day] = transaction.date.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      const dayOfWeek = date.getDay()
      
      // Calculate start of week (Sunday)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - dayOfWeek)
      
      const weekKey = formatDateToYYYYMMDD(weekStart)
      const currentTotal = weeklyTotals.get(weekKey) || 0
      weeklyTotals.set(weekKey, currentTotal + Number(transaction.amount))
    })
  
    // Convert to array and sort by week start date
    return Array.from(weeklyTotals.entries())
      .map(([week_start, total_spent]) => ({
        week_start,
        total_spent
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
  }
}

export const transactionService = new TransactionService() 
