import { z } from 'zod'

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Monto debe ser mayor a 0'),
  date: z.string().datetime('Fecha debe ser válida'),
  category_id: z.string().uuid('Categoría debe ser válida'),
  description: z.string().optional(),
})

export type TransactionFormData = z.infer<typeof transactionSchema> 