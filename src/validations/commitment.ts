import { z } from 'zod'
import { CURRENCIES } from '@/lib/constants'

const currencySchema = z.enum([CURRENCIES.ARS, CURRENCIES.USD])

export const commitmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato AAAA-MM-DD'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de vencimiento debe estar en formato AAAA-MM-DD'),
  description: z.string().min(1, 'La descripción es requerida').optional().or(z.literal('')),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: currencySchema,
  payment_method: z.enum(['debit', 'credit', 'cash', 'transfer']),
  status: z.enum(['pending', 'partial', 'completed']).optional().default('pending'),
  installments_count: z.number().int().min(1, 'Debe registrar al menos 1 cuota').optional().default(1),
  category_id: z.string().uuid().optional().nullable(),
  expense_kind: z.enum(['variable', 'fixed']).optional().nullable(),
  card_label: z.string().optional().nullable(),
})

export type CommitmentFormData = z.infer<typeof commitmentSchema>
