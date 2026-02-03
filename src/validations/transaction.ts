import { z } from 'zod'
import { EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS } from '@/lib/constants'

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Monto debe ser mayor a 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category_id: z.string().uuid('Categoría debe ser válida'),
  description: z.string().optional(),
  expense_kind: z.enum([EXPENSE_KINDS.FIXED, EXPENSE_KINDS.VARIABLE]).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.type === 'expense' && data.date >= EXPENSE_KIND_REQUIRED_FROM && !data.expense_kind) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tipo de gasto requerido (fijo o variable)',
      path: ['expense_kind'],
    })
  }
})

export type TransactionFormData = z.infer<typeof transactionSchema> 
