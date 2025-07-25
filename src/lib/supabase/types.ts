export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          name: string | null
          created_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name?: string | null
          created_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string | null
          created_at?: string
          owner_id?: string
        }
      }
      budget_users: {
        Row: {
          id: string
          user_id: string
          budget_id: string
          role: 'owner' | 'collaborator'
        }
        Insert: {
          id?: string
          user_id: string
          budget_id: string
          role: 'owner' | 'collaborator'
        }
        Update: {
          id?: string
          user_id?: string
          budget_id?: string
          role?: 'owner' | 'collaborator'
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
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          user_id: string
          category_id: string
          type: 'income' | 'expense'
          amount: number
          date: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          user_id?: string
          category_id?: string
          type?: 'income' | 'expense'
          amount?: number
          date?: string
          description?: string
          created_at?: string
        }
      }
    }
  }
}
