import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { budgetService } from './budget.service'
import { commitmentSchema, type CommitmentFormData } from '@/validations/commitment'
import { type CurrencyCode } from './transaction.service'

export interface Commitment {
  id: string
  budget_id: string
  user_id: string
  description: string | null
  amount: number
  currency: CurrencyCode
  date: string
  due_date: string
  payment_method: 'debit' | 'credit' | 'cash' | 'transfer'
  status: 'pending' | 'partial' | 'completed'
  category_id?: string | null
  expense_kind?: 'variable' | 'fixed' | null
  card_label?: string | null
  installments_count?: number
  created_at: string
}

export interface Installment {
  id: string
  commitment_id: string
  amount: number
  due_date: string
  status: 'pending' | 'completed'
  installment_number: number
  total_installments: number
  created_at: string
}

export type InstallmentWithCommitment = Installment & {
  commitments: {
    description: string | null
    currency: CurrencyCode
    payment_method: 'debit' | 'credit' | 'cash' | 'transfer'
    category_id?: string | null
    expense_kind?: 'variable' | 'fixed' | null
    card_label?: string | null
    date?: string
  }
}

function addMonthsToDateString(dateStr: string, monthsToAdd: number): string {
  if (monthsToAdd === 0) return dateStr
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const originalDay = Number(dayStr)
  
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + monthsToAdd, 1)
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  
  const targetDay = Math.min(originalDay, lastDayOfTargetMonth)
  date.setDate(targetDay)
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export class CommitmentService {
  private getSupabaseClient() {
    if (typeof window === 'undefined') {
      throw new Error('CommitmentService must be used in browser environment')
    }
    return createBrowserSupabaseClient()
  }

  async createCommitment(userId: string, commitmentData: Partial<CommitmentFormData>): Promise<Commitment> {
    const validatedData = commitmentSchema.parse(commitmentData)
    const budgetId = await budgetService.getUserBudgetId(userId)

    if (!budgetId) {
      throw new Error('No se encontró el presupuesto del usuario')
    }

    const supabase = this.getSupabaseClient()
    const installmentsCount = validatedData.installments_count ?? 1

    // 1. Crear el Commitment
    const { data: commitment, error: commitmentError } = await supabase
      .from('commitments')
      .insert({
        budget_id: budgetId,
        user_id: userId,
        description: validatedData.description || null,
        amount: validatedData.amount,
        currency: validatedData.currency,
        date: validatedData.date,
        due_date: validatedData.due_date,
        payment_method: validatedData.payment_method,
        status: validatedData.status || 'pending',
        category_id: validatedData.category_id || null,
        expense_kind: validatedData.expense_kind || null,
        card_label: validatedData.card_label || null,
      })
      .select()
      .single()

    if (commitmentError) throw commitmentError

    // 2. Generar y Crear las cuotas (Installments)
    const baseAmount = Math.floor((validatedData.amount / installmentsCount) * 100) / 100
    const remainder = Math.round((validatedData.amount - (baseAmount * installmentsCount)) * 100) / 100

    const installmentsPayload = []
    for (let i = 1; i <= installmentsCount; i++) {
      const installmentAmount = i === 1 ? baseAmount + remainder : baseAmount
      const installmentDueDate = addMonthsToDateString(validatedData.due_date, i - 1)

      installmentsPayload.push({
        commitment_id: commitment.id,
        amount: installmentAmount,
        due_date: installmentDueDate,
        status: 'pending',
        installment_number: i,
        total_installments: installmentsCount,
      })
    }

    const { error: installmentsError } = await supabase
      .from('installments')
      .insert(installmentsPayload)

    if (installmentsError) {
      // Intenta borrar el commitment creado si falló la creación de cuotas
      await supabase.from('commitments').delete().eq('id', commitment.id)
      throw installmentsError
    }

    return commitment as Commitment
  }

  async getUserCommitments(
    userId: string,
    options?: {
      status?: 'pending' | 'partial' | 'completed'
      page?: number
      pageSize?: number
    }
  ): Promise<{ data: Commitment[]; total: number }> {
    const budgetId = await budgetService.getUserBudgetId(userId)

    if (!budgetId) {
      return { data: [], total: 0 }
    }

    const { status, page = 1, pageSize = 10 } = options || {}
    const supabase = this.getSupabaseClient()

    let query = supabase
      .from('commitments')
      .select('*', { count: 'exact' })
      .eq('budget_id', budgetId)
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, count, error } = await query.range(from, to)

    if (error) throw error

    return {
      data: (data as Commitment[] | null) ?? [],
      total: count ?? 0,
    }
  }

  async getUserInstallments(
    userId: string,
    options?: {
      startDate?: string
      endDate?: string
      status?: 'pending' | 'completed'
    }
  ): Promise<InstallmentWithCommitment[]> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) return []

    const { startDate, endDate, status } = options || {}
    const supabase = this.getSupabaseClient()

    let query = supabase
      .from('installments')
      .select(`
        *,
        commitments!inner (
          id,
          budget_id,
          user_id,
          description,
          currency,
          payment_method,
          category_id,
          expense_kind,
          card_label,
          date
        )
      `)
      .eq('commitments.budget_id', budgetId)
      .eq('commitments.user_id', userId)
      .order('due_date', { ascending: true })

    if (startDate) {
      query = query.gte('due_date', startDate)
    }
    if (endDate) {
      query = query.lte('due_date', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    return (data as unknown as InstallmentWithCommitment[]) ?? []
  }

  async getCommittedCapital(
    userId: string,
    options?: {
      startDate?: string
      endDate?: string
    }
  ): Promise<{ ARS: number; USD: number }> {
    const installments = await this.getUserInstallments(userId, {
      ...options,
      status: 'pending'
    })

    const result = { ARS: 0, USD: 0 }
    for (const inst of installments) {
      const currency = inst.commitments?.currency
      if (currency === 'ARS' || currency === 'USD') {
        result[currency] += inst.amount
      }
    }

    return result
  }

  async getCommitmentDetails(commitmentId: string): Promise<{
    commitment: Commitment
    installments: Installment[]
  }> {
    const supabase = this.getSupabaseClient()

    const { data: commitment, error: cErr } = await supabase
      .from('commitments')
      .select('*')
      .eq('id', commitmentId)
      .single()

    if (cErr) throw cErr

    const { data: installments, error: iErr } = await supabase
      .from('installments')
      .select('*')
      .eq('commitment_id', commitmentId)
      .order('installment_number', { ascending: true })

    if (iErr) throw iErr

    return {
      commitment: commitment as Commitment,
      installments: (installments as Installment[]) ?? [],
    }
  }

  async registerPayment(
    userId: string,
    paymentData: {
      amount: number
      currency: CurrencyCode
      date: string
      description?: string
      installmentIds: string[]
    }
  ): Promise<string> {
    const budgetId = await budgetService.getUserBudgetId(userId)
    if (!budgetId) throw new Error('No se encontró el presupuesto del usuario')

    const supabase = this.getSupabaseClient()

    // 1. Inserción del Payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        budget_id: budgetId,
        user_id: userId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        date: paymentData.date,
        description: paymentData.description || null
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // 2. Buscar las cuotas para verificar montos y realizar imputaciones
    const { data: installments, error: instError } = await supabase
      .from('installments')
      .select('id, amount, commitment_id')
      .in('id', paymentData.installmentIds)

    if (instError) throw instError

    let remainingPayment = paymentData.amount
    const paymentInstallmentsPayload = []
    const commitmentsToUpdate = new Set<string>()

    for (const inst of (installments || [])) {
      if (remainingPayment <= 0) break

      // Obtener cuánto se le ha pagado ya a esta cuota
      const { data: appliedRows, error: appliedError } = await supabase
        .from('payment_installments')
        .select('amount_applied')
        .eq('installment_id', inst.id)

      if (appliedError) throw appliedError
      
      const alreadyPaid = (appliedRows || []).reduce((sum, row) => sum + Number(row.amount_applied), 0)
      const remainingDue = Math.max(0, inst.amount - alreadyPaid)

      if (remainingDue > 0) {
        const toApply = Math.min(remainingPayment, remainingDue)
        remainingPayment = Math.round((remainingPayment - toApply) * 100) / 100

        paymentInstallmentsPayload.push({
          payment_id: payment.id,
          installment_id: inst.id,
          amount_applied: toApply
        })

        commitmentsToUpdate.add(inst.commitment_id)

        // Si con este pago se cubre la cuota, la marcamos como completada
        if (Math.round((alreadyPaid + toApply) * 100) / 100 >= inst.amount) {
          const { error: updInstError } = await supabase
            .from('installments')
            .update({ status: 'completed' })
            .eq('id', inst.id)
          if (updInstError) throw updInstError
        }
      }
    }

    if (paymentInstallmentsPayload.length > 0) {
      const { error: piError } = await supabase
        .from('payment_installments')
        .insert(paymentInstallmentsPayload)
      if (piError) throw piError
    }

    // 3. Actualizar el estado de los Commitments afectados
    for (const commitmentId of Array.from(commitmentsToUpdate)) {
      // Obtener todas las cuotas de este compromiso y verificar su estado
      const { data: allInsts, error: fetchAllError } = await supabase
        .from('installments')
        .select('id, status')
        .eq('commitment_id', commitmentId)

      if (fetchAllError) throw fetchAllError

      const allCompleted = (allInsts || []).every(i => i.status === 'completed')

      // Verificar si hay algún pago parcial sobre este compromiso
      let hasAnyPayment = false
      const instIds = (allInsts || []).map(i => i.id)
      const { data: anyPayments, error: anyPaymentsError } = await supabase
        .from('payment_installments')
        .select('installment_id')
        .in('installment_id', instIds)
        .limit(1)

      if (anyPaymentsError) throw anyPaymentsError
      if (anyPayments && anyPayments.length > 0) {
        hasAnyPayment = true
      }

      let newStatus: 'pending' | 'completed' | 'partial' = 'pending'
      if (allCompleted) {
        newStatus = 'completed'
      } else if (hasAnyPayment) {
        newStatus = 'partial'
      }

      const { error: updCommError } = await supabase
        .from('commitments')
        .update({ status: newStatus })
        .eq('id', commitmentId)

      if (updCommError) throw updCommError
    }

    return payment.id
  }

  async deleteCommitment(commitmentId: string, userId: string): Promise<void> {
    const supabase = this.getSupabaseClient()

    const { error } = await supabase
      .from('commitments')
      .delete()
      .eq('id', commitmentId)
      .eq('user_id', userId)

    if (error) throw error
  }

  async deletePayment(paymentId: string, userId: string): Promise<void> {
    const supabase = this.getSupabaseClient()

    // 1. Obtener relaciones de imputación
    const { data: piRows, error: piError } = await supabase
      .from('payment_installments')
      .select('installment_id')
      .eq('payment_id', paymentId)

    if (piError) throw piError

    // 2. Borrar el pago real (la cascada limpia la tabla payment_installments automáticamente)
    const { error: delPaymentError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', userId)

    if (delPaymentError) throw delPaymentError

    // 3. Revertir estado de las cuotas afectadas a pending
    const commitmentsToUpdate = new Set<string>()
    const installmentIds = (piRows || []).map(pi => pi.installment_id)

    if (installmentIds.length > 0) {
      const { data: updatedInsts, error: updInstError } = await supabase
        .from('installments')
        .update({ status: 'pending' })
        .in('id', installmentIds)
        .select('commitment_id')

      if (updInstError) throw updInstError

      if (updatedInsts) {
        updatedInsts.forEach((inst) => {
          commitmentsToUpdate.add(inst.commitment_id)
        })
      }
    }

    // 4. Recalcular estado de los compromisos
    for (const commitmentId of Array.from(commitmentsToUpdate)) {
      const { data: allInsts, error: fetchAllError } = await supabase
        .from('installments')
        .select('id, status')
        .eq('commitment_id', commitmentId)

      if (fetchAllError) throw fetchAllError

      const allCompleted = (allInsts || []).every(i => i.status === 'completed')

      let hasAnyPayment = false
      const instIds = (allInsts || []).map(i => i.id)
      const { data: anyPayments, error: anyPaymentsError } = await supabase
        .from('payment_installments')
        .select('installment_id')
        .in('installment_id', instIds)
        .limit(1)

      if (anyPaymentsError) throw anyPaymentsError
      if (anyPayments && anyPayments.length > 0) {
        hasAnyPayment = true
      }

      let newStatus: 'pending' | 'completed' | 'partial' = 'pending'
      if (allCompleted) {
        newStatus = 'completed'
      } else if (hasAnyPayment) {
        newStatus = 'partial'
      }

      const { error: updCommError } = await supabase
        .from('commitments')
        .update({ status: newStatus })
        .eq('id', commitmentId)

      if (updCommError) throw updCommError
    }
  }
}

export const commitmentService = new CommitmentService()

