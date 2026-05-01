import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { budgetService } from './budget.service'
import { openingBalanceOverrideService, type OpeningBalanceOverride } from './openingBalanceOverride.service'
import { transactionSchema, type TransactionFormData } from '@/validations/transaction'
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils'
import { CURRENCIES, EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS, TRANSACTION_TYPES } from '@/lib/constants'

const CATEGORY_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
]

export type CurrencyCode = keyof typeof CURRENCIES
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]

export interface BalanceByCurrency {
  ARS: number
  USD: number
}

interface TransactionRow {
  id: string
  budget_id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: string | number | null
  currency: CurrencyCode | null
  from_currency: CurrencyCode | null
  from_amount: string | number | null
  to_currency: CurrencyCode | null
  to_amount: string | number | null
  exchange_rate: string | number | null
  date: string
  description: string | null
  created_at: string
  expense_kind: 'fixed' | 'variable' | null
  categories?: { name: string } | { name: string }[] | null
}

export interface Transaction {
  id: string
  budget_id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: number | null
  currency: CurrencyCode | null
  from_currency: CurrencyCode | null
  from_amount: number | null
  to_currency: CurrencyCode | null
  to_amount: number | null
  exchange_rate: number | null
  date: string
  description: string | null
  created_at: string
  expense_kind?: 'fixed' | 'variable' | null
  categories?: { name: string } | null
}

export interface Category {
  id: string
  name: string
  expense_kind?: 'fixed' | 'variable' | null
}

export interface TransactionSummary {
  openingBalance: BalanceByCurrency
  totalIncome: number
  totalFixedExpenses: number
  totalVariableExpenses: number
  totalExpenses: number
  netBalance: BalanceByCurrency
}

const EMPTY_BALANCE: BalanceByCurrency = {
  ARS: 0,
  USD: 0,
}

const isLegacyExpense = (date: string) => date < EXPENSE_KIND_REQUIRED_FROM

const isVariableExpense = (date: string, expenseKind: string | null | undefined) =>
  isLegacyExpense(date) || expenseKind === EXPENSE_KINDS.VARIABLE

const isFixedExpense = (date: string, expenseKind: string | null | undefined) =>
  !isLegacyExpense(date) && expenseKind === EXPENSE_KINDS.FIXED

const cloneBalance = (balance: BalanceByCurrency): BalanceByCurrency => ({
  ARS: balance.ARS,
  USD: balance.USD,
})

const normalizeCurrency = (currency: CurrencyCode | null | undefined): CurrencyCode =>
  currency ?? CURRENCIES.ARS

const normalizeNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  return Number(value)
}

const normalizeCategoryRelation = (
  relation: TransactionRow['categories']
): { name: string } | null => {
  if (!relation) {
    return null
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

const normalizeTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  budget_id: row.budget_id,
  user_id: row.user_id,
  category_id: row.category_id,
  type: row.type,
  amount: normalizeNumber(row.amount),
  currency: row.currency,
  from_currency: row.from_currency,
  from_amount: normalizeNumber(row.from_amount),
  to_currency: row.to_currency,
  to_amount: normalizeNumber(row.to_amount),
  exchange_rate: normalizeNumber(row.exchange_rate),
  date: row.date,
  description: row.description,
  created_at: row.created_at,
  expense_kind: row.expense_kind,
  categories: normalizeCategoryRelation(row.categories),
})

const applyTransactionToBalance = (balance: BalanceByCurrency, transaction: Transaction) => {
  switch (transaction.type) {
    case TRANSACTION_TYPES.INCOME: {
      const currency = normalizeCurrency(transaction.currency)
      balance[currency] += transaction.amount ?? 0
      return
    }
    case TRANSACTION_TYPES.EXPENSE: {
      const currency = normalizeCurrency(transaction.currency)
      balance[currency] -= transaction.amount ?? 0
      return
    }
    case TRANSACTION_TYPES.ADJUSTMENT: {
      const currency = normalizeCurrency(transaction.currency)
      balance[currency] += transaction.amount ?? 0
      return
    }
    case TRANSACTION_TYPES.TRANSFER: {
      if (transaction.from_currency && transaction.from_amount != null) {
        balance[transaction.from_currency] -= transaction.from_amount
      }
      if (transaction.to_currency && transaction.to_amount != null) {
        balance[transaction.to_currency] += transaction.to_amount
      }
    }
  }
}

const buildTransactionPayload = (validatedData: TransactionFormData) => {
  switch (validatedData.type) {
    case TRANSACTION_TYPES.INCOME:
      return {
        category_id: validatedData.category_id,
        type: validatedData.type,
        amount: validatedData.amount,
        currency: validatedData.currency,
        from_currency: null,
        from_amount: null,
        to_currency: null,
        to_amount: null,
        exchange_rate: null,
        description: validatedData.description || null,
        expense_kind: null,
      }
    case TRANSACTION_TYPES.EXPENSE:
      return {
        category_id: validatedData.category_id,
        type: validatedData.type,
        amount: validatedData.amount,
        currency: validatedData.currency,
        from_currency: null,
        from_amount: null,
        to_currency: null,
        to_amount: null,
        exchange_rate: null,
        description: validatedData.description || null,
        expense_kind: validatedData.expense_kind ?? null,
      }
    case TRANSACTION_TYPES.ADJUSTMENT:
      return {
        category_id: null,
        type: validatedData.type,
        amount: validatedData.amount,
        currency: validatedData.currency,
        from_currency: null,
        from_amount: null,
        to_currency: null,
        to_amount: null,
        exchange_rate: null,
        description: validatedData.description || null,
        expense_kind: null,
      }
    case TRANSACTION_TYPES.TRANSFER:
      return {
        category_id: null,
        type: validatedData.type,
        amount: null,
        currency: null,
        from_currency: validatedData.from_currency,
        from_amount: validatedData.from_amount,
        to_currency: validatedData.to_currency,
        to_amount: validatedData.to_amount,
        exchange_rate: validatedData.from_amount / validatedData.to_amount,
        description: validatedData.description || null,
        expense_kind: null,
      }
  }
}

export class TransactionService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('TransactionService must be used in browser environment')
    }
    return createBrowserSupabaseClient()
  }

  async createTransaction(userId: string, transactionData: Partial<TransactionFormData>): Promise<Transaction> {
    const validatedData = transactionSchema.parse(transactionData)
    const budgetId = await budgetService.getUserBudgetId(userId)

    if (!budgetId) {
      throw new Error('No se encontró el presupuesto del usuario')
    }

    const supabase = this.getSupabaseClient()
    const payload = buildTransactionPayload(validatedData)

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        budget_id: budgetId,
        user_id: userId,
        date: validatedData.date,
        ...payload,
      })
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        currency,
        from_currency,
        from_amount,
        to_currency,
        to_amount,
        exchange_rate,
        date,
        description,
        expense_kind,
        created_at,
        categories (
          name
        )
      `)
      .single()

    if (error) throw error

    return normalizeTransaction(data as TransactionRow)
  }

  async getUserTransactions(
    userId: string,
    options?: {
      page?: number
      pageSize?: number
      dateRange?: { startDate: string; endDate: string }
      categoryId?: string
      type?: TransactionType
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
      search,
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
        currency,
        from_currency,
        from_amount,
        to_currency,
        to_amount,
        exchange_rate,
        date,
        description,
        expense_kind,
        created_at,
        categories (
          name
        )
      `, { count: 'exact' })
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

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

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, count, error } = await query.range(from, to)

    if (error) throw error

    return {
      data: ((data as TransactionRow[] | null) ?? []).map(normalizeTransaction),
      total: count ?? 0,
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
    const validatedData = transactionSchema.parse(transactionData)
    const supabase = this.getSupabaseClient()
    const payload = buildTransactionPayload(validatedData)

    const { data, error } = await supabase
      .from('transactions')
      .update({
        date: validatedData.date,
        ...payload,
      })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        currency,
        from_currency,
        from_amount,
        to_currency,
        to_amount,
        exchange_rate,
        date,
        description,
        expense_kind,
        created_at,
        categories (
          name
        )
      `)
      .single()

    if (error) throw error

    return normalizeTransaction(data as TransactionRow)
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
  ): Promise<TransactionSummary> {
    const budgetId = await budgetService.getUserBudgetId(userId)

    if (!budgetId) {
      return {
        openingBalance: cloneBalance(EMPTY_BALANCE),
        totalIncome: 0,
        totalFixedExpenses: 0,
        totalVariableExpenses: 0,
        totalExpenses: 0,
        netBalance: cloneBalance(EMPTY_BALANCE),
      }
    }

    const supabase = this.getSupabaseClient()
    const startDate = options?.dateRange?.startDate ?? '0001-01-01'
    const endDate = options?.dateRange?.endDate ?? '9999-12-31'

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        currency,
        from_currency,
        from_amount,
        to_currency,
        to_amount,
        exchange_rate,
        date,
        description,
        expense_kind,
        created_at
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error

    const transactions = ((data as TransactionRow[] | null) ?? []).map(normalizeTransaction)
    const openingBalance = cloneBalance(EMPTY_BALANCE)
    const netBalance = cloneBalance(EMPTY_BALANCE)
    let totalIncome = 0
    let totalFixedExpenses = 0
    let totalVariableExpenses = 0

    // Compute totals (income / fixed / variable) over the requested date window
    transactions.forEach((transaction) => {
      // totals for reporting should consider transactions within the month range
      if (transaction.date >= startDate && transaction.date <= endDate) {
        if (transaction.type === TRANSACTION_TYPES.INCOME && normalizeCurrency(transaction.currency) === CURRENCIES.ARS) {
          totalIncome += transaction.amount ?? 0
        }

        if (transaction.type === TRANSACTION_TYPES.EXPENSE && normalizeCurrency(transaction.currency) === CURRENCIES.ARS) {
          if (isFixedExpense(transaction.date, transaction.expense_kind)) {
            totalFixedExpenses += transaction.amount ?? 0
          } else if (isVariableExpense(transaction.date, transaction.expense_kind)) {
            totalVariableExpenses += transaction.amount ?? 0
          }
        }
      }
    })

    // Determine openingBalance and netBalance behavior depending on override presence
    try {
      // Parse selected month/year
      const [selectedYear, selectedMonth] = startDate.split('-').map(Number)

      // Find the most recent override on or before the selected month with a single query
      let anchor: { year: number; month: number; row: OpeningBalanceOverride } | null = null

      const { data: anchorRows, error: anchorError } = await supabase
        .from('opening_balance_overrides')
        .select('*')
        .eq('budget_id', budgetId)
        .or(`year.lt.${selectedYear},and(year.eq.${selectedYear},month.lte.${selectedMonth})`)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1)

      if (anchorError) throw anchorError

      const firstAnchor = (anchorRows as OpeningBalanceOverride[] | null) && (anchorRows as OpeningBalanceOverride[])[0]
      if (firstAnchor) {
        anchor = { year: firstAnchor.year, month: firstAnchor.month, row: firstAnchor }
      }

  if (anchor) {
        // Anchor found. Build anchor start date (YYYY-MM-01)
        const anchorStartDate = `${anchor.year}-${String(anchor.month).padStart(2, '0')}-01`

        // opening starts at the anchor's override amounts
        openingBalance.ARS = Number(anchor.row.ars_amount) ?? 0
        openingBalance.USD = Number(anchor.row.usd_amount) ?? 0

        // Propagate transactions from anchorStartDate up to selected month start (exclusive) into opening
        transactions.forEach((transaction) => {
          if (transaction.date >= anchorStartDate && transaction.date < startDate) {
            applyTransactionToBalance(openingBalance, transaction)
          }
        })

        // Net starts from the opening (which already includes anchor + rolled-forward months)
        netBalance.ARS = openingBalance.ARS
        netBalance.USD = openingBalance.USD

        // Then apply only selected-month transactions to net
        transactions.forEach((transaction) => {
          if (transaction.date >= startDate && transaction.date <= endDate) {
            applyTransactionToBalance(netBalance, transaction)
          }
        })
      } else {
        // No anchor found: previous behavior
        // opening = sum(transactions with date < startDate)
        transactions.forEach((transaction) => {
          if (transaction.date < startDate) {
            applyTransactionToBalance(openingBalance, transaction)
          }
        })

        // net = apply all transactions up to endDate
        transactions.forEach((transaction) => {
          if (transaction.date <= endDate) {
            applyTransactionToBalance(netBalance, transaction)
          }
        })
      }
    } catch {
      // On error retrieving override, fallback to previous behavior
      transactions.forEach((transaction) => {
        if (transaction.date < startDate) {
          applyTransactionToBalance(openingBalance, transaction)
        }
        if (transaction.date <= endDate) {
          applyTransactionToBalance(netBalance, transaction)
        }
      })
    }

    return {
      openingBalance,
      totalIncome,
      totalFixedExpenses,
      totalVariableExpenses,
      totalExpenses: totalFixedExpenses + totalVariableExpenses,
      netBalance,
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
    const startDate =
      dateRange?.startDate ||
      formatDateToYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    const endDate =
      dateRange?.endDate ||
      formatDateToYYYYMMDD(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        currency,
        from_currency,
        from_amount,
        to_currency,
        to_amount,
        exchange_rate,
        date,
        description,
        expense_kind,
        created_at,
        categories (
          name
        )
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', TRANSACTION_TYPES.EXPENSE)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error

    const transactions = ((data as TransactionRow[] | null) ?? []).map(normalizeTransaction)
    const categoryTotals = new Map<string, number>()
    let totalAmount = 0

    transactions.forEach((transaction) => {
      if (normalizeCurrency(transaction.currency) !== CURRENCIES.ARS) {
        return
      }

      if (!isVariableExpense(transaction.date, transaction.expense_kind)) {
        return
      }

      const categoryName = transaction.categories?.name ?? 'Unknown'
      const amount = transaction.amount ?? 0

      categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + amount)
      totalAmount += amount
    })

    const sortedCategories = Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const topCategories = sortedCategories.slice(0, 5)
    const otherCategories = sortedCategories.slice(5)
    const categories = topCategories.map((category, index) => ({
      name: category.name,
      value: category.value,
      percentage: totalAmount > 0 ? (category.value / totalAmount) * 100 : 0,
      color: CATEGORY_COLORS[index] || CATEGORY_COLORS[0],
    }))

    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, category) => sum + category.value, 0)
      categories.push({
        name: 'Other',
        value: otherTotal,
        percentage: totalAmount > 0 ? (otherTotal / totalAmount) * 100 : 0,
        color: CATEGORY_COLORS[5] || '#6B7280',
      })
    }

    return {
      categories,
      totalAmount,
      topCategoriesCount: topCategories.length,
    }
  }

  async getIncomeExpenseHistory(
    userId: string,
    monthsBack: number = 6
  ): Promise<
    Array<{
      month: string
      income: number
      expense: number
      savings: number
    }>
  > {
    const budgetId =
      await budgetService.getUserBudgetId(userId)

    if (!budgetId) {
      return []
    }

    const supabase =
      this.getSupabaseClient()

    const endDate = new Date()

    const startDate = new Date()
    startDate.setMonth(
      startDate.getMonth() -
        monthsBack +
        1
    )
    startDate.setDate(1)

    const { data, error } =
      await supabase
        .from('transactions')
        .select(`
          id,
          budget_id,
          user_id,
          category_id,
          type,
          amount,
          currency,
          from_currency,
          from_amount,
          to_currency,
          to_amount,
          exchange_rate,
          date,
          description,
          expense_kind,
          created_at
        `)
        .eq('budget_id', budgetId)
        .eq('user_id', userId)
        .gte(
          'date',
          formatDateToYYYYMMDD(
            startDate
          )
        )
        .lte(
          'date',
          formatDateToYYYYMMDD(
            endDate
          )
        )
        .order('date', {
          ascending: true,
        })

    if (error) {
      throw error
    }

    const transactions =
      (
        (data as
          | TransactionRow[]
          | null) ?? []
      ).map(
        normalizeTransaction
      )

    const months: string[] = []

    const temp = new Date(
      startDate
    )

    while (temp <= endDate) {
      months.push(
        `${temp.getFullYear()}-${String(
          temp.getMonth() + 1
        ).padStart(2, '0')}`
      )

      temp.setMonth(
        temp.getMonth() + 1
      )
    }

    const results =
      new Map<
        string,
        {
          income: number
          expense: number
        }
      >()

    months.forEach((month) => {
      results.set(month, {
        income: 0,
        expense: 0,
      })
    })

    transactions.forEach(
      (transaction) => {
        const [year, month] =
          transaction.date.split(
            '-'
          )

        const monthKey = `${year}-${month}`

        if (
          !results.has(
            monthKey
          )
        ) {
          return
        }

        const current =
          results.get(
            monthKey
          )!

        const currency =
          normalizeCurrency(
            transaction.currency
          )

        if (
          currency !==
          CURRENCIES.ARS
        ) {
          return
        }

        if (
          transaction.type ===
          TRANSACTION_TYPES.INCOME
        ) {
          current.income +=
            transaction.amount ??
            0
        }

        if (
          transaction.type ===
            TRANSACTION_TYPES.EXPENSE &&
          isVariableExpense(
            transaction.date,
            transaction.expense_kind
          )
        ) {
          current.expense +=
            transaction.amount ??
            0
        }
      }
    )

    return months.map(
      (month) => {
        const data =
          results.get(
            month
          )!

        return {
          month,
          income:
            data.income,
          expense:
            data.expense,
          savings:
            data.income -
            data.expense,
        }
      }
    )
  }

  async getSpendingByDayOfWeek(
    userId: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<Array<{
    dayOfWeek: string
    totalSpent: number
    dayIndex: number
    date: string
  }>> {
    const budgetId = await budgetService.getUserBudgetId(userId)

    if (!budgetId) return []

    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        currency,
        from_currency,
        from_amount,
        to_currency,
        to_amount,
        exchange_rate,
        date,
        description,
        expense_kind,
        created_at
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', TRANSACTION_TYPES.EXPENSE)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)

    if (error) throw error

    const transactions = ((data as TransactionRow[] | null) ?? []).map(normalizeTransaction)
    const dateTotals = new Map<string, number>()

    transactions.forEach((transaction) => {
      if (normalizeCurrency(transaction.currency) !== CURRENCIES.ARS) {
        return
      }

      if (!isVariableExpense(transaction.date, transaction.expense_kind)) {
        return
      }

      const currentTotal = dateTotals.get(transaction.date) || 0
      dateTotals.set(transaction.date, currentTotal + (transaction.amount ?? 0))
    })

    const sevenDaysData: Array<{
      dayOfWeek: string
      totalSpent: number
      dayIndex: number
      date: string
    }> = []

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      const dateKey = formatDateToYYYYMMDD(date)
      sevenDaysData.push({
        dayOfWeek: dayNames[date.getDay()],
        totalSpent: dateTotals.get(dateKey) || 0,
        dayIndex: 6 - i,
        date: dateKey,
      })
    }

    return sevenDaysData
  }

  async getWeeklySpending(
    userId: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<Array<{
    week_start: string
    total_spent: number
  }>> {
    const budgetId = await budgetService.getUserBudgetId(userId)

    if (!budgetId) return []

    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        budget_id,
        user_id,
        category_id,
        type,
        amount,
        currency,
        from_currency,
        from_amount,
        to_currency,
        to_amount,
        exchange_rate,
        date,
        description,
        expense_kind,
        created_at
      `)
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .eq('type', TRANSACTION_TYPES.EXPENSE)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)

    if (error) throw error

    const transactions = ((data as TransactionRow[] | null) ?? []).map(normalizeTransaction)
    const weeklyTotals = new Map<string, number>()

    transactions.forEach((transaction) => {
      if (normalizeCurrency(transaction.currency) !== CURRENCIES.ARS) {
        return
      }

      if (!isVariableExpense(transaction.date, transaction.expense_kind)) {
        return
      }

      const [year, month, day] = transaction.date.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay()
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - dayOfWeek)

      const weekKey = formatDateToYYYYMMDD(weekStart)
      const currentTotal = weeklyTotals.get(weekKey) || 0
      weeklyTotals.set(weekKey, currentTotal + (transaction.amount ?? 0))
    })

    return Array.from(weeklyTotals.entries())
      .map(([week_start, total_spent]) => ({
        week_start,
        total_spent,
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
  }
}

export const transactionService = new TransactionService()
