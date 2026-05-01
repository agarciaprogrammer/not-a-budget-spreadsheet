import { z } from 'zod'
import { CURRENCIES, EXPENSE_KIND_REQUIRED_FROM, EXPENSE_KINDS, TRANSACTION_TYPES } from '@/lib/constants'

const currencySchema = z.enum([CURRENCIES.ARS, CURRENCIES.USD])
const baseTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z.string().optional(),
})

const incomeSchema = baseTransactionSchema.extend({
  type: z.literal(TRANSACTION_TYPES.INCOME),
  amount: z.number().positive('Monto debe ser mayor a 0'),
  currency: currencySchema,
  category_id: z.string().uuid('Categoría debe ser válida'),
})

const expenseSchema = baseTransactionSchema.extend({
  type: z.literal(TRANSACTION_TYPES.EXPENSE),
  amount: z.number().positive('Monto debe ser mayor a 0'),
  currency: currencySchema,
  category_id: z.string().uuid('Categoría debe ser válida'),
  expense_kind: z.enum([EXPENSE_KINDS.FIXED, EXPENSE_KINDS.VARIABLE]).optional().nullable(),
})

const transferSchema = baseTransactionSchema.extend({
  type: z.literal(TRANSACTION_TYPES.TRANSFER),
  from_currency: currencySchema,
  from_amount: z.number().positive('Monto origen debe ser mayor a 0'),
  to_currency: currencySchema,
  to_amount: z.number().positive('Monto destino debe ser mayor a 0'),
})

const adjustmentSchema = baseTransactionSchema.extend({
  type: z.literal(TRANSACTION_TYPES.ADJUSTMENT),
  amount: z.number().refine((value) => value !== 0, 'El monto no puede ser 0'),
  currency: currencySchema,
})

export const transactionSchema = z.union([
  incomeSchema,
  expenseSchema,
  transferSchema,
  adjustmentSchema,
]).superRefine((data, ctx) => {
  if (
    data.type === TRANSACTION_TYPES.EXPENSE &&
    data.date >= EXPENSE_KIND_REQUIRED_FROM &&
    !data.expense_kind
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tipo de gasto requerido (fijo o variable)',
      path: ['expense_kind'],
    })
  }

  if (
    data.type === TRANSACTION_TYPES.TRANSFER &&
    data.from_currency === data.to_currency
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las monedas deben ser distintas en una transferencia',
      path: ['to_currency'],
    })
  }
})

export type TransactionFormData = z.infer<typeof transactionSchema>
