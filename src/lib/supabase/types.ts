export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          name: string | null
          owner_id: string
          created_at: string
          monthly_limit: number | null
        }
        Insert: {
          id?: string
          name?: string | null
          owner_id: string
          created_at?: string
          monthly_limit?: number | null
        }
        Update: {
          id?: string
          name?: string | null
          owner_id?: string
          created_at?: string
          monthly_limit?: number | null
        }
      }
      budget_users: {
        Row: {
          id: string
          budget_id: string
          user_id: string
          role: 'owner' | 'collaborator'
        }
        Insert: {
          id?: string
          budget_id: string
          user_id: string
          role?: 'owner' | 'collaborator'
        }
        Update: {
          id?: string
          budget_id?: string
          user_id?: string
          role?: 'owner' | 'collaborator'
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
          expense_kind: 'fixed' | 'variable' | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
          expense_kind?: 'fixed' | 'variable' | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
          expense_kind?: 'fixed' | 'variable' | null
          is_active?: boolean
        }
      }
      monthly_limits: {
        Row: {
          id: string
          budget_id: string
          year: number
          month: number
          amount_limit: number
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          year: number
          month: number
          amount_limit: number
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          year?: number
          month?: number
          amount_limit?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          budget_id: string
          user_id: string
          category_id: string | null
          type: 'income' | 'expense' | 'transfer' | 'adjustment'
          amount: number | null
          date: string
          description: string | null
          created_at: string
          expense_kind: 'fixed' | 'variable' | null
          currency: 'ARS' | 'USD' | null
          from_currency: 'ARS' | 'USD' | null
          from_amount: number | null
          to_currency: 'ARS' | 'USD' | null
          to_amount: number | null
          exchange_rate: number | null
        }
        Insert: {
          id?: string
          budget_id: string
          user_id: string
          category_id?: string | null
          type: 'income' | 'expense' | 'transfer' | 'adjustment'
          amount?: number | null
          date: string
          description?: string | null
          created_at?: string
          expense_kind?: 'fixed' | 'variable' | null
          currency?: 'ARS' | 'USD' | null
          from_currency?: 'ARS' | 'USD' | null
          from_amount?: number | null
          to_currency?: 'ARS' | 'USD' | null
          to_amount?: number | null
          exchange_rate?: number | null
        }
        Update: {
          id?: string
          budget_id?: string
          user_id?: string
          category_id?: string | null
          type?: 'income' | 'expense' | 'transfer' | 'adjustment'
          amount?: number | null
          date?: string
          description?: string | null
          created_at?: string
          expense_kind?: 'fixed' | 'variable' | null
          currency?: 'ARS' | 'USD' | null
          from_currency?: 'ARS' | 'USD' | null
          from_amount?: number | null
          to_currency?: 'ARS' | 'USD' | null
          to_amount?: number | null
          exchange_rate?: number | null
        }
      }
    }
  }
}
