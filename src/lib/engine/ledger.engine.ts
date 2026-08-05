// LedgerEngine - Motor unificado del Libro Mayor Continuo

export interface LedgerTransaction {
  id: string
  date: string
  type: 'income' | 'expense' | 'transfer' | 'adjustment'
  kind?: 'fixed' | 'variable'
  amount: number
  currency: 'ARS' | 'USD'
  account_id?: string | null
  from_account_id?: string | null
  to_account_id?: string | null
  from_amount?: number | null
  to_amount?: number | null
  from_currency?: 'ARS' | 'USD' | null
  to_currency?: 'ARS' | 'USD' | null
}

export interface LedgerSnapshotAccount {
  account_id: string
  opening_balance: number
  currency?: 'ARS' | 'USD'
}

export interface LedgerSnapshot {
  id: string
  version: number
  effective_date: string
  ledger_snapshot_accounts?: LedgerSnapshotAccount[]
}

export interface AccountBalanceResult {
  accountId: string
  balance: number
}

export interface LedgerTotals {
  openingBalance: { ARS: number; USD: number }
  netBalance: { ARS: number; USD: number }
  totalIncome: number
  totalFixedExpenses: number
  totalVariableExpenses: number
  totalExpenses: number
}

/**
 * LedgerEngine - Motor unificado del Libro Mayor
 *
 * Aplica el principio de fuente única de verdad:
 * Saldo = Ledger Genesis + Suma(Transacciones) + Suma(Ajustes)
 */
export class LedgerEngine {
  /**
   * Aplica una transacción individual a un balance acumulativo por moneda
   */
  static applyTransactionToBalance(
    balance: { ARS: number; USD: number },
    transaction: LedgerTransaction
  ): void {
    const amount = Number(transaction.amount) || 0
    const currency = transaction.currency || 'ARS'

    if (transaction.type === 'income' || transaction.type === 'adjustment') {
      if (currency in balance) {
        balance[currency] += amount
      }
    } else if (transaction.type === 'expense') {
      if (currency in balance) {
        balance[currency] -= amount
      }
    } else if (transaction.type === 'transfer') {
      if (transaction.from_currency && transaction.from_amount) {
        if (transaction.from_currency in balance) {
          balance[transaction.from_currency] -= Number(transaction.from_amount)
        }
      }
      if (transaction.to_currency && transaction.to_amount) {
        if (transaction.to_currency in balance) {
          balance[transaction.to_currency] += Number(transaction.to_amount)
        }
      }
    }
  }

  /**
   * Calcula los saldos acumulados individuales por cuenta (account_id)
   */
  static calculateAccountBalances(
    accounts: { id: string; currency: 'ARS' | 'USD' }[],
    snapshot: LedgerSnapshot | null,
    transactions: LedgerTransaction[]
  ): Map<string, number> {
    const balanceMap = new Map<string, number>()
    const effectiveDate = snapshot?.effective_date || '1970-01-01'

    // 1. Inicializar saldos en 0
    accounts.forEach((acc) => balanceMap.set(acc.id, 0))

    // 2. Cargar saldos de apertura del Genesis
    if (snapshot?.ledger_snapshot_accounts) {
      snapshot.ledger_snapshot_accounts.forEach((item) => {
        if (balanceMap.has(item.account_id)) {
          balanceMap.set(item.account_id, Number(item.opening_balance) || 0)
        }
      })
    }

    // 3. Aplicar transacciones desde la fecha del Genesis en adelante
    transactions.forEach((tx) => {
      if (tx.date >= effectiveDate) {
        const amount = Number(tx.amount) || 0

        // Transacciones asociadas directamente por account_id
        if (tx.account_id && balanceMap.has(tx.account_id)) {
          const current = balanceMap.get(tx.account_id) || 0
          if (tx.type === 'income' || tx.type === 'adjustment') {
            balanceMap.set(tx.account_id, current + amount)
          } else if (tx.type === 'expense') {
            balanceMap.set(tx.account_id, current - amount)
          }
        }

        // Manejo de transferencias inter-cuenta
        if (tx.type === 'transfer') {
          if (tx.from_account_id && balanceMap.has(tx.from_account_id)) {
            const current = balanceMap.get(tx.from_account_id) || 0
            const debit = Number(tx.from_amount) || amount
            balanceMap.set(tx.from_account_id, current - debit)
          }
          if (tx.to_account_id && balanceMap.has(tx.to_account_id)) {
            const current = balanceMap.get(tx.to_account_id) || 0
            const credit = Number(tx.to_amount) || amount
            balanceMap.set(tx.to_account_id, current + credit)
          }
        }
      }
    })

    return balanceMap
  }

  /**
   * Calcula los totales del Dashboard para un período (startDate a endDate)
   */
  static calculateDashboardTotals(
    snapshot: LedgerSnapshot | null,
    transactions: LedgerTransaction[],
    startDate: string,
    endDate: string
  ): LedgerTotals {
    const openingBalance = { ARS: 0, USD: 0 }
    const netBalance = { ARS: 0, USD: 0 }

    let totalIncome = 0
    let totalFixedExpenses = 0
    let totalVariableExpenses = 0

    const effectiveDate = snapshot?.effective_date || '1970-01-01'

    // 1. Inicializar Opening con el Genesis Snapshot
    if (snapshot?.ledger_snapshot_accounts) {
      snapshot.ledger_snapshot_accounts.forEach((item) => {
        const curr = item.currency || 'ARS'
        if (curr in openingBalance) {
          openingBalance[curr] += Number(item.opening_balance) || 0
        }
      })
    }

    // 2. Recorrer transacciones y acumular
    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0

      // Totales del período seleccionado
      if (tx.date >= startDate && tx.date <= endDate) {
        if (tx.type === 'income') {
          totalIncome += amount
        } else if (tx.type === 'expense') {
          if (tx.kind === 'fixed') {
            totalFixedExpenses += amount
          } else {
            totalVariableExpenses += amount
          }
        }
      }

      // Roll forward desde Genesis hasta startDate (Opening Balance del período)
      if (tx.date >= effectiveDate && tx.date < startDate) {
        this.applyTransactionToBalance(openingBalance, tx)
      }

      // Roll forward desde Genesis hasta endDate (Net Balance del período)
      if (tx.date >= effectiveDate && tx.date <= endDate) {
        this.applyTransactionToBalance(netBalance, tx)
      }
    })

    return {
      openingBalance,
      netBalance,
      totalIncome,
      totalFixedExpenses,
      totalVariableExpenses,
      totalExpenses: totalFixedExpenses + totalVariableExpenses,
    }
  }
}
