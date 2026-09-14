// Proxy to maintain backward compatibility with components using the old service
import * as financial from './financial'

export type { Fee, Expense, Invoice, InvoiceItem } from './financial'

export const getFees = () => financial.getFullFees()
export const getExpenses = () => financial.getFullExpenses()
export const getInvoices = () => financial.getFullInvoices()

export const getFee = financial.getFee
export const createFee = financial.createFee
export const updateFee = financial.updateFee
export const deleteFee = financial.deleteFee

export const getExpense = financial.getExpense
export const createExpense = financial.createExpense
export const updateExpense = financial.updateExpense
export const deleteExpense = financial.deleteExpense
export const getReceiptUrl = financial.getReceiptUrl

export const getInvoice = financial.getInvoice
export const createInvoice = financial.createInvoice
export const updateInvoice = financial.updateInvoice
export const deleteInvoice = financial.deleteInvoice
