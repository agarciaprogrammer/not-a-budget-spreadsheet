import { createBrowserSupabaseClient } from './client'
import { budgetService } from '@/lib/services/budget.service'
import { CURRENCIES, EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS, TRANSACTION_TYPES } from '@/lib/constants'

export interface SummaryData {
  openingBalance: {
    ARS: number
    USD: number
  }
  totalIncome: number
  totalFixedExpenses: number
  totalVariableExpenses: number
  totalExpenses: number
  netBalance: {
    ARS: number
    USD: number
  }
}

interface QueryTransactionRow {
  type: 'income' | 'expense' | 'transfer' | 'adjustment'
  amount: number | null
  currency: 'ARS' | 'USD' | null
  from_currency: 'ARS' | 'USD' | null
  from_amount: number | null
  to_currency: 'ARS' | 'USD' | null
  to_amount: number | null
  date: string
  expense_kind: 'fixed' | 'variable' | null
}

const isLegacyExpense = (date: string) => date < EXPENSE_KIND_REQUIRED_FROM

const isVariableExpense = (date: string, expenseKind: string | null | undefined) =>
  isLegacyExpense(date) || expenseKind === EXPENSE_KINDS.VARIABLE

const isFixedExpense = (date: string, expenseKind: string | null | undefined) =>
  !isLegacyExpense(date) && expenseKind === EXPENSE_KINDS.FIXED

const normalizeCurrency = (currency: 'ARS' | 'USD' | null | undefined) => currency ?? CURRENCIES.ARS

const applyTransaction = (
  balance: { ARS: number; USD: number },
  transaction: QueryTransactionRow
) => {
  switch (transaction.type) {
    case TRANSACTION_TYPES.INCOME:
      balance[normalizeCurrency(transaction.currency)] += transaction.amount ?? 0
      return
    case TRANSACTION_TYPES.EXPENSE:
      balance[normalizeCurrency(transaction.currency)] -= transaction.amount ?? 0
      return
    case TRANSACTION_TYPES.ADJUSTMENT:
      balance[normalizeCurrency(transaction.currency)] += transaction.amount ?? 0
      return
    case TRANSACTION_TYPES.TRANSFER:
      if (transaction.from_currency && transaction.from_amount != null) {
        balance[transaction.from_currency] -= transaction.from_amount
      }
      if (transaction.to_currency && transaction.to_amount != null) {
        balance[transaction.to_currency] += transaction.to_amount
      }
  }
}

export async function getSummaryData(userId: string): Promise<SummaryData> {
  const supabase = createBrowserSupabaseClient()
  const budgetId = await budgetService.getUserBudgetId(userId)

  if (!budgetId) {
    throw new Error('No budget found for user')
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      type,
      amount,
      currency,
      from_currency,
      from_amount,
      to_currency,
      to_amount,
      date,
      expense_kind
    `)
    .eq('budget_id', budgetId)
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (error) throw error

  const openingBalance = { ARS: 0, USD: 0 }
  const netBalance = { ARS: 0, USD: 0 }
  let totalIncome = 0
  let totalFixedExpenses = 0
  let totalVariableExpenses = 0

  ;(transactions as QueryTransactionRow[] | null)?.forEach((transaction) => {
    applyTransaction(netBalance, transaction)

    if (transaction.type === TRANSACTION_TYPES.INCOME && normalizeCurrency(transaction.currency) === CURRENCIES.ARS) {
      totalIncome += transaction.amount ?? 0
      return
    }

    if (transaction.type !== TRANSACTION_TYPES.EXPENSE) {
      return
    }

    if (normalizeCurrency(transaction.currency) !== CURRENCIES.ARS) {
      return
    }

    if (isFixedExpense(transaction.date, transaction.expense_kind)) {
      totalFixedExpenses += transaction.amount ?? 0
      return
    }

    if (isVariableExpense(transaction.date, transaction.expense_kind)) {
      totalVariableExpenses += transaction.amount ?? 0
    }
  })

  return {
    openingBalance,
    totalIncome,
    totalFixedExpenses,
    totalVariableExpenses,
    totalExpenses: totalFixedExpenses + totalVariableExpenses,
    netBalance,
  }
}
