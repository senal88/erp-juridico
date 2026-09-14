import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Fee extends RecordModel {
  title: string
  kind: 'fixo' | 'exito' | 'recorrente' | 'sucumbencial' | 'consulta'
  amount?: number
  percentage?: number
  billing_basis?: 'valor_causa' | 'acordo' | 'condenacao' | 'valor_contratado' | 'outra'
  recurrence?: 'unica' | 'mensal' | 'trimestral' | 'anual'
  due_date?: string
  status: 'pendente' | 'cobrado' | 'recebido' | 'cancelado'
  received_at?: string
  notes?: string
  client: string
  process?: string
  expand?: {
    client?: RecordModel
    process?: RecordModel
  }
}

export interface Expense extends RecordModel {
  title: string
  kind:
    | 'custas'
    | 'cartorio'
    | 'pericia'
    | 'copias'
    | 'transporte'
    | 'estacionamento'
    | 'correios'
    | 'outras'
  amount: number
  date_incurred: string
  reimbursable?: boolean
  reimbursed?: boolean
  reimbursed_at?: string
  description?: string
  receipt?: string
  paid_by?: string
  process: string
  expand?: {
    paid_by?: RecordModel
    process?: RecordModel
  }
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice extends RecordModel {
  number: string
  client: string
  process?: string
  issue_date: string
  due_date: string
  status: 'rascunho' | 'enviada' | 'paga' | 'vencida' | 'cancelada'
  subtotal?: number
  discount?: number
  total?: number
  paid_at?: string
  payment_method?: 'pix' | 'boleto' | 'transferencia' | 'cartao' | 'cheque' | 'dinheiro' | 'outro'
  notes?: string
  items_json?: InvoiceItem[] | null
  expand?: {
    client?: RecordModel
    process?: RecordModel
  }
}

// Fee Management
export const getFees = (page = 1, perPage = 50, options = {}) =>
  pb
    .collection('fees')
    .getList<Fee>(page, perPage, { sort: '-created', expand: 'client,process', ...options })

export const getFullFees = (options = {}) =>
  pb.collection('fees').getFullList<Fee>({ sort: '-created', expand: 'client,process', ...options })

export const getFee = (id: string, options = {}) =>
  pb.collection('fees').getOne<Fee>(id, { expand: 'client,process', ...options })

export const createFee = (data: Partial<Fee>) => pb.collection('fees').create<Fee>(data)

export const updateFee = (id: string, data: Partial<Fee>) =>
  pb.collection('fees').update<Fee>(id, data)

export const deleteFee = (id: string) => pb.collection('fees').delete(id)

export const getFeesByProcess = (processId: string, options = {}) =>
  pb.collection('fees').getFullList<Fee>({
    filter: `process = "${processId}"`,
    sort: '-created',
    expand: 'client,process',
    ...options,
  })

// Expense Management
export const getExpenses = (page = 1, perPage = 50, options = {}) =>
  pb.collection('expenses').getList<Expense>(page, perPage, {
    sort: '-date_incurred',
    expand: 'process,paid_by',
    ...options,
  })

export const getFullExpenses = (options = {}) =>
  pb.collection('expenses').getFullList<Expense>({
    sort: '-date_incurred',
    expand: 'process,paid_by',
    ...options,
  })

export const getExpense = (id: string, options = {}) =>
  pb.collection('expenses').getOne<Expense>(id, { expand: 'process,paid_by', ...options })

export const createExpense = (data: Partial<Expense> | FormData) =>
  pb.collection('expenses').create<Expense>(data)

export const updateExpense = (id: string, data: Partial<Expense> | FormData) =>
  pb.collection('expenses').update<Expense>(id, data)

export const deleteExpense = (id: string) => pb.collection('expenses').delete(id)

export const getExpensesByProcess = (processId: string, options = {}) =>
  pb.collection('expenses').getFullList<Expense>({
    filter: `process = "${processId}"`,
    sort: '-date_incurred',
    expand: 'process,paid_by',
    ...options,
  })

export const getReceiptUrl = (
  expense: Pick<Expense, 'collectionId' | 'id' | 'receipt'>,
): string | null => {
  if (!expense.receipt) return null
  return pb.files.getURL(expense as unknown as RecordModel, expense.receipt)
}

// Invoice Management
export const getInvoices = (page = 1, perPage = 50, options = {}) =>
  pb.collection('invoices').getList<Invoice>(page, perPage, {
    sort: '-issue_date',
    expand: 'client,process',
    ...options,
  })

export const getFullInvoices = (options = {}) =>
  pb.collection('invoices').getFullList<Invoice>({
    sort: '-issue_date',
    expand: 'client,process',
    ...options,
  })

export const getInvoice = (id: string, options = {}) =>
  pb.collection('invoices').getOne<Invoice>(id, { expand: 'client,process', ...options })

export const createInvoice = (data: Partial<Invoice>) =>
  pb.collection('invoices').create<Invoice>(data)

export const updateInvoice = (id: string, data: Partial<Invoice>) =>
  pb.collection('invoices').update<Invoice>(id, data)

export const deleteInvoice = (id: string) => pb.collection('invoices').delete(id)

// Logic & Calculations
export const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  try {
    const latest = await pb.collection('invoices').getFirstListItem(`number ~ '^${year}/'`, {
      sort: '-number',
    })
    if (latest && latest.number) {
      const parts = latest.number.split('/')
      if (parts.length === 2) {
        const seq = parseInt(parts[1], 10)
        if (!isNaN(seq)) {
          return `${year}/${String(seq + 1).padStart(4, '0')}`
        }
      }
    }
  } catch (e) {
    // getFirstListItem throws an error if no records match, meaning we start at 0001
  }
  return `${year}/0001`
}

export const calcInvoiceTotal = (items: InvoiceItem[], discount: number = 0): number => {
  const subtotal = items.reduce((acc, item) => {
    const itemTotal = item.total ?? item.quantity * item.unit_price
    return acc + (itemTotal || 0)
  }, 0)
  return Math.max(0, subtotal - discount)
}

export const isInvoiceOverdue = (invoice: Pick<Invoice, 'status' | 'due_date'>): boolean => {
  if (invoice.status === 'paga' || invoice.status === 'cancelada') return false
  if (!invoice.due_date) return false

  const dueIso = invoice.due_date.split(' ')[0] // e.g., "2024-05-10"
  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`

  return dueIso < todayIso
}
