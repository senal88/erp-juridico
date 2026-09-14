import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Send,
  XCircle,
  FileText,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
  calcInvoiceTotal,
  type Invoice,
  type InvoiceItem,
} from '@/services/financial'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  formatBRL,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_VARIANT,
  INVOICE_PAYMENT_METHOD_LABELS,
} from '@/lib/financial-labels'
import { InvoiceItemDialog } from '@/components/finance/InvoiceItemDialog'

export default function InvoiceDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1)
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null)

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])

  const [discountEditing, setDiscountEditing] = useState(false)
  const [discountVal, setDiscountVal] = useState('')

  const loadData = async () => {
    if (!id) return
    try {
      const data = await getInvoice(id)
      setInvoice(data)
    } catch (err) {
      toast({ title: 'Erro', description: 'Fatura não encontrada', variant: 'destructive' })
      navigate('/financeiro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('invoices', (e) => {
    if (e.record.id === id) loadData()
  })

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
  }

  const handleSaveItem = async (item: InvoiceItem) => {
    if (!invoice) return
    const items = [...(invoice.items_json || [])]
    if (editingItemIndex >= 0) {
      items[editingItemIndex] = item
    } else {
      items.push(item)
    }
    const subtotal = calcInvoiceTotal(items, 0)
    const total = calcInvoiceTotal(items, invoice.discount || 0)

    try {
      await updateInvoice(invoice.id, { items_json: items, subtotal, total })
      toast({ description: 'Item salvo.' })
    } catch (e: any) {
      toast({ description: e.message, variant: 'destructive' })
    }
  }

  const handleDeleteItem = async (index: number) => {
    if (!invoice) return
    const items = [...(invoice.items_json || [])]
    items.splice(index, 1)
    const subtotal = calcInvoiceTotal(items, 0)
    const total = calcInvoiceTotal(items, invoice.discount || 0)

    try {
      await updateInvoice(invoice.id, { items_json: items, subtotal, total })
      toast({ description: 'Item removido.' })
    } catch (e: any) {
      toast({ description: e.message, variant: 'destructive' })
    }
  }

  const handleSaveDiscount = async () => {
    if (!invoice) return
    const d = parseFloat(discountVal.replace(',', '.')) || 0
    const total = calcInvoiceTotal(invoice.items_json || [], d)
    try {
      await updateInvoice(invoice.id, { discount: d, total })
      setDiscountEditing(false)
    } catch (e: any) {
      toast({ description: e.message, variant: 'destructive' })
    }
  }

  const markAsSent = async () => {
    if (!invoice || !invoice.items_json?.length) {
      toast({ description: 'Adicione pelo menos um item.', variant: 'destructive' })
      return
    }
    await updateInvoice(invoice.id, { status: 'enviada' })
    toast({ description: 'Fatura marcada como enviada.' })
  }

  const markAsPaid = async () => {
    if (!invoice || !paymentMethod || !paymentDate) return
    const d = paymentDate + ' 12:00:00.000Z'
    await updateInvoice(invoice.id, {
      status: 'paga',
      payment_method: paymentMethod as any,
      paid_at: d,
    })
    toast({ description: 'Fatura marcada como paga.' })
    setPaymentDialogOpen(false)
  }

  const cancelInvoice = async () => {
    if (!invoice) return
    await updateInvoice(invoice.id, { status: 'cancelada' })
    toast({ description: 'Fatura cancelada.' })
  }

  const deleteDraft = async () => {
    if (!invoice) return
    await deleteInvoice(invoice.id)
    toast({ description: 'Rascunho apagado.' })
    navigate('/financeiro')
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  if (!invoice) return null

  const items = invoice.items_json || []
  const isDraft = invoice.status === 'rascunho'
  const isSent = invoice.status === 'enviada'
  const isFinal = invoice.status === 'paga' || invoice.status === 'cancelada'

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in-up pb-24">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link
          to="/financeiro"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para Financeiro
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-3">
            Fatura {invoice.number}
            <Badge
              className={`shadow-none text-sm px-3 py-1 ${INVOICE_STATUS_VARIANT[invoice.status] || ''}`}
              variant="outline"
            >
              {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
            </Badge>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={deleteDraft}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Apagar Fatura
              </Button>
              <Button onClick={markAsSent} disabled={items.length === 0}>
                <Send className="w-4 h-4 mr-2" /> Marcar como Enviada
              </Button>
            </>
          )}
          {isSent && (
            <>
              <Button variant="outline" onClick={cancelInvoice}>
                <XCircle className="w-4 h-4 mr-2" /> Cancelar Fatura
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Paga
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Itens da Fatura</CardTitle>
                <CardDescription>Produtos ou serviços cobrados.</CardDescription>
              </div>
              {isDraft && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedItem(null)
                    setEditingItemIndex(-1)
                    setItemDialogOpen(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Item
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-md bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center">
                  <FileText className="w-8 h-8 opacity-20 mb-2" />
                  Nenhum item adicionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2 font-medium">Descrição</th>
                        <th className="px-4 py-2 font-medium">Qtd</th>
                        <th className="px-4 py-2 font-medium">Valor Unit.</th>
                        <th className="px-4 py-2 font-medium">Total</th>
                        {isDraft && <th className="px-4 py-2 font-medium text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium">{it.description}</td>
                          <td className="px-4 py-3">{it.quantity}</td>
                          <td className="px-4 py-3">{formatBRL(it.unit_price)}</td>
                          <td className="px-4 py-3 font-medium">{formatBRL(it.total)}</td>
                          {isDraft && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedItem(it)
                                    setEditingItemIndex(idx)
                                    setItemDialogOpen(true)
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteItem(idx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-full md:w-1/2 ml-auto space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatBRL(invoice.subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Desconto</span>
                  {discountEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-24 h-8 text-right"
                        value={discountVal}
                        onChange={(e) => setDiscountVal(e.target.value)}
                        autoFocus
                      />
                      <Button size="sm" className="h-8 px-2" onClick={handleSaveDiscount}>
                        Ok
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-destructive">
                        {invoice.discount ? `- ${formatBRL(invoice.discount)}` : 'R$ 0,00'}
                      </span>
                      {isDraft && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setDiscountVal(invoice.discount?.toString() || '0')
                            setDiscountEditing(true)
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl text-primary">{formatBRL(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Cliente</span>
                <span className="font-medium">{invoice.expand?.client?.name || '-'}</span>
              </div>
              {invoice.expand?.process && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    Processo Associado
                  </span>
                  <span className="font-medium">{invoice.expand.process.title}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Emissão</span>
                  <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Vencimento</span>
                  <span className="font-medium">{formatDate(invoice.due_date)}</span>
                </div>
              </div>
              {invoice.notes && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Observações</span>
                  <p className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {isFinal && (
            <Card>
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.status === 'paga' ? (
                  <>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Fatura Paga</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Data</span>
                        <span className="font-medium">{formatDate(invoice.paid_at)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Forma</span>
                        <span className="font-medium capitalize">
                          {INVOICE_PAYMENT_METHOD_LABELS[invoice.payment_method || ''] ||
                            invoice.payment_method}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Fatura Cancelada.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <InvoiceItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={selectedItem}
        onSave={handleSaveItem}
      />

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INVOICE_PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={markAsPaid}
              disabled={!paymentMethod || !paymentDate}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
