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
          category_id: string
          type: 'income' | 'expense'
          amount: number
          date: string
          description: string | null
          created_at: string
          expense_kind: 'fixed' | 'variable' | null
        }
        Insert: {
          id?: string
          budget_id: string
          user_id: string
          category_id: string
          type: 'income' | 'expense'
          amount: number
          date: string
          description?: string | null
          created_at?: string
          expense_kind?: 'fixed' | 'variable' | null
        }
        Update: {
          id?: string
          budget_id?: string
          user_id?: string
          category_id?: string
          type?: 'income' | 'expense'
          amount?: number
          date?: string
          description?: string | null
          created_at?: string
          expense_kind?: 'fixed' | 'variable' | null
        }
      }
    }
  }
}
