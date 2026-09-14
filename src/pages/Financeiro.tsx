import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PlusCircle,
  DollarSign,
  FileText,
  Receipt,
  Search,
  Download,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  getFullFees,
  getFullExpenses,
  getFullInvoices,
  type Fee,
  type Expense,
  type Invoice,
  getReceiptUrl,
} from '@/services/financial'
import { useRealtime } from '@/hooks/use-realtime'
import {
  FEE_KIND_LABELS,
  FEE_STATUS_LABELS,
  EXPENSE_KIND_LABELS,
  FEE_STATUS_VARIANT,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_VARIANT,
} from '@/lib/financial-labels'
import { FeeSheet } from '@/components/finance/FeeSheet'
import { ExpenseSheet } from '@/components/finance/ExpenseSheet'
import { InvoiceSheet } from '@/components/finance/InvoiceSheet'
import { PageHeader } from '@/components/PageHeader'

export default function Financeiro() {
  const navigate = useNavigate()
  const [fees, setFees] = useState<Fee[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all')
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false)

  const [feeSearch, setFeeSearch] = useState('')
  const [feeStatusFilter, setFeeStatusFilter] = useState('all')
  const [feeTypeFilter, setFeeTypeFilter] = useState('all')

  const [expenseSearch, setExpenseSearch] = useState('')
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all')
  const [expenseReimbursementFilter, setExpenseReimbursementFilter] = useState('all')

  const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
  const [feeSheetOpen, setFeeSheetOpen] = useState(false)

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)

  const loadData = async () => {
    try {
      const [f, e, i] = await Promise.all([getFullFees(), getFullExpenses(), getFullInvoices()])
      setFees(f)
      setExpenses(e)
      setInvoices(i)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('fees', loadData)
  useRealtime('expenses', loadData)
  useRealtime('invoices', loadData)

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
  }

  const filteredFees = fees.filter((f) => {
    const s = f.title.toLowerCase().includes(feeSearch.toLowerCase())
    const t = feeTypeFilter === 'all' || f.kind === feeTypeFilter
    const st = feeStatusFilter === 'all' || f.status === feeStatusFilter
    return s && t && st
  })

  const filteredExpenses = expenses.filter((e) => {
    const s = e.title.toLowerCase().includes(expenseSearch.toLowerCase())
    const t = expenseTypeFilter === 'all' || e.kind === expenseTypeFilter
    const r =
      expenseReimbursementFilter === 'all'
        ? true
        : expenseReimbursementFilter === 'reimbursed'
          ? e.reimbursed === true
          : expenseReimbursementFilter === 'pending'
            ? e.reimbursable === true && e.reimbursed !== true
            : true
    return s && t && r
  })

  const filteredInvoices = invoices.filter((i) => {
    const s =
      i.number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (i.expand?.client?.name || '').toLowerCase().includes(invoiceSearch.toLowerCase())
    const st = invoiceStatusFilter === 'all' || i.status === invoiceStatusFilter
    return s && st
  })

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const todayStr = now.toISOString().split('T')[0]

  const revenueThisMonth = fees
    .filter((f) => f.status === 'recebido' && f.received_at?.startsWith(currentMonthStr))
    .reduce((acc, f) => acc + (f.amount || 0), 0)

  const toReceive = fees
    .filter((f) => f.status === 'pendente' || f.status === 'cobrado')
    .reduce((acc, f) => acc + (f.amount || 0), 0)

  const overdueFees = fees.filter(
    (f) => f.status === 'cobrado' && f.due_date && f.due_date < todayStr,
  )
  const overdueValue = overdueFees.reduce((acc, f) => acc + (f.amount || 0), 0)
  const overdueCount = overdueFees.length

  const expensesThisMonth = expenses
    .filter((e) => e.date_incurred?.startsWith(currentMonthStr))
    .reduce((acc, e) => acc + (e.amount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <Skeleton className="h-12 w-[250px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title="Financeiro" description="Gestão de honorários, despesas e faturas." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(revenueThisMonth)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A receber</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(toReceive)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(overdueValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueCount} {overdueCount === 1 ? 'item' : 'itens'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
            <Receipt className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expensesThisMonth)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="honorarios" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="honorarios" className="gap-2">
            <DollarSign className="w-4 h-4" /> Honorários
          </TabsTrigger>
          <TabsTrigger value="despesas" className="gap-2">
            <Receipt className="w-4 h-4" /> Despesas
          </TabsTrigger>
          <TabsTrigger value="faturas" className="gap-2">
            <FileText className="w-4 h-4" /> Faturas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="honorarios" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center justify-between pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <CardTitle className="text-lg">Honorários</CardTitle>
                <CardDescription>Gerencie as cobranças de honorários dos clientes.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setSelectedFee(null)
                  setFeeSheetOpen(true)
                }}
              >
                <PlusCircle className="w-4 h-4" /> Novo Honorário
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center bg-slate-50/30 dark:bg-slate-900/30">
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar honorário..."
                    value={feeSearch}
                    onChange={(e) => setFeeSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="cobrado">Cobrado</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="fixo">Fixo</SelectItem>
                    <SelectItem value="exito">Êxito</SelectItem>
                    <SelectItem value="recorrente">Recorrente</SelectItem>
                    <SelectItem value="sucumbencial">Sucumbencial</SelectItem>
                    <SelectItem value="consulta">Consulta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filteredFees.length === 0 ? (
                <div className="p-16 text-center border-t flex flex-col items-center justify-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Nenhum honorário encontrado
                  </h3>
                  <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                    Não encontramos honorários correspondentes aos filtros selecionados ou você
                    ainda não possui registros.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFee(null)
                      setFeeSheetOpen(true)
                    }}
                  >
                    Adicionar o primeiro honorário
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Título</th>
                        <th className="px-6 py-3 font-medium">Cliente</th>
                        <th className="px-6 py-3 font-medium">Tipo</th>
                        <th className="px-6 py-3 font-medium">Vencimento</th>
                        <th className="px-6 py-3 font-medium">Valor</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredFees.map((fee) => (
                        <tr
                          key={fee.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedFee(fee)
                            setFeeSheetOpen(true)
                          }}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                            {fee.title}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {fee.expand?.client?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {FEE_KIND_LABELS[fee.kind] || fee.kind}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(fee.due_date)}
                          </td>
                          <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                            {fee.amount
                              ? formatCurrency(fee.amount)
                              : fee.percentage
                                ? `${fee.percentage.toFixed(2).replace('.', ',')}%`
                                : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={`shadow-none font-medium ${FEE_STATUS_VARIANT[fee.status] || ''}`}
                              variant="outline"
                            >
                              {FEE_STATUS_LABELS[fee.status] || fee.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center justify-between pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <CardTitle className="text-lg">Despesas Reembolsáveis</CardTitle>
                <CardDescription>Controle de custos do processo para reembolso.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setSelectedExpense(null)
                  setExpenseSheetOpen(true)
                }}
              >
                <PlusCircle className="w-4 h-4" /> Nova Despesa
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center bg-slate-50/30 dark:bg-slate-900/30">
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar despesa..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(EXPENSE_KIND_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={expenseReimbursementFilter}
                  onValueChange={setExpenseReimbursementFilter}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Reembolso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">A Reembolsar</SelectItem>
                    <SelectItem value="reimbursed">Reembolsadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filteredExpenses.length === 0 ? (
                <div className="p-16 text-center border-t flex flex-col items-center justify-center">
                  <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Nenhuma despesa encontrada
                  </h3>
                  <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                    Não encontramos despesas correspondentes aos filtros selecionados ou você ainda
                    não possui registros.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedExpense(null)
                      setExpenseSheetOpen(true)
                    }}
                  >
                    Adicionar a primeira despesa
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Título</th>
                        <th className="px-6 py-3 font-medium">Processo</th>
                        <th className="px-6 py-3 font-medium">Tipo</th>
                        <th className="px-6 py-3 font-medium">Data</th>
                        <th className="px-6 py-3 font-medium">Valor</th>
                        <th className="px-6 py-3 font-medium">Status Reembolso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedExpense(expense)
                            setExpenseSheetOpen(true)
                          }}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              {expense.title}
                              {expense.receipt && (
                                <a
                                  href={getReceiptUrl(expense) || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Baixar comprovante"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {expense.expand?.process?.title || '-'}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {EXPENSE_KIND_LABELS[expense.kind] || expense.kind}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(expense.date_incurred)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4">
                            {expense.reimbursable ? (
                              <Badge
                                className={`shadow-none font-medium ${expense.reimbursed ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'}`}
                                variant="outline"
                              >
                                {expense.reimbursed ? 'Reembolsada' : 'A Reembolsar'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturas" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center justify-between pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <CardTitle className="text-lg">Faturas</CardTitle>
                <CardDescription>Emissão e gestão de faturas enviadas.</CardDescription>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setInvoiceSheetOpen(true)}>
                <PlusCircle className="w-4 h-4" /> Nova Fatura
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center bg-slate-50/30 dark:bg-slate-900/30">
                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar fatura por número ou cliente..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {filteredInvoices.length === 0 ? (
                <div className="p-16 text-center border-t flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Nenhuma fatura encontrada
                  </h3>
                  <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                    Não encontramos faturas correspondentes aos filtros selecionados ou você ainda
                    não possui registros.
                  </p>
                  <Button variant="outline" onClick={() => setInvoiceSheetOpen(true)}>
                    Criar a primeira fatura
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Nº</th>
                        <th className="px-6 py-3 font-medium">Cliente</th>
                        <th className="px-6 py-3 font-medium">Emissão</th>
                        <th className="px-6 py-3 font-medium">Vencimento</th>
                        <th className="px-6 py-3 font-medium">Total</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/financeiro/faturas/${invoice.id}`)}
                        >
                          <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                            {invoice.number}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                            {invoice.expand?.client?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(invoice.issue_date)}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(invoice.due_date)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                            {formatCurrency(invoice.total)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={`shadow-none font-medium ${INVOICE_STATUS_VARIANT[invoice.status] || ''}`}
                              variant="outline"
                            >
                              {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FeeSheet
        open={feeSheetOpen}
        onOpenChange={setFeeSheetOpen}
        fee={selectedFee}
        onSave={loadData}
      />

      <ExpenseSheet
        open={expenseSheetOpen}
        onOpenChange={setExpenseSheetOpen}
        expense={selectedExpense}
        onSave={loadData}
      />

      <InvoiceSheet open={invoiceSheetOpen} onOpenChange={setInvoiceSheetOpen} />
    </div>
  )
}
