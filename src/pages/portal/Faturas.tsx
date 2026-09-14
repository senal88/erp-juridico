import { useState, useEffect } from 'react'
import { DollarSign, CheckCircle2, AlertCircle, Clock, Receipt } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

import type { Invoice } from '@/services/financial'

const INVOICE_STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

const INVOICE_STATUS_VARIANTS: Record<string, string> = {
  rascunho: 'bg-slate-100 text-slate-800',
  enviada: 'bg-blue-100 text-blue-800',
  paga: 'bg-emerald-100 text-emerald-800',
  vencida: 'bg-destructive/10 text-destructive',
  cancelada: 'bg-slate-100 text-slate-800 line-through',
}

export default function PortalFaturas() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await pb.collection('invoices').getFullList<Invoice>({
          sort: '-due_date',
          expand: 'process',
        })
        // Filtering to not show 'rascunho' to clients
        setInvoices(data.filter((i) => i.status !== 'rascunho'))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const pendingInvoices = invoices.filter((i) => i.status === 'enviada' || i.status === 'vencida')
  const toPayAmount = pendingInvoices.reduce((acc, i) => acc + (i.total || 0), 0)

  const paidInvoices = invoices.filter((i) => i.status === 'paga')
  const totalIssued = invoices.length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Faturas e Pagamentos</h2>
        <p className="text-muted-foreground mt-1">Acompanhe seu histórico financeiro.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 mb-4">
              <p className="text-sm font-medium text-primary">A Pagar</p>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                toPayAmount,
              )}
            </div>
            <p className="text-xs text-primary/70 mt-1">
              {pendingInvoices.length} fatura(s) pendente(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 mb-4">
              <p className="text-sm font-medium text-slate-600">Faturas Pagas</p>
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{paidInvoices.length}</div>
            <p className="text-xs text-slate-500 mt-1">Pagamentos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 mb-4">
              <p className="text-sm font-medium text-slate-600">Total Emitido</p>
              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                <Receipt className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{totalIssued}</div>
            <p className="text-xs text-slate-500 mt-1">Faturas no seu histórico</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Receipt className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-900 mb-1">Nenhuma fatura encontrada</p>
              <p>Você não possui faturas registradas em nosso sistema.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => {
                const isOverdue = inv.status === 'vencida'
                return (
                  <div
                    key={inv.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border ${
                      isOverdue
                        ? 'border-destructive bg-destructive/5'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          inv.status === 'paga'
                            ? 'bg-emerald-100 text-emerald-600'
                            : isOverdue
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {inv.status === 'paga' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isOverdue ? (
                          <AlertCircle className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-slate-900">Fatura #{inv.number}</h4>
                          <Badge
                            className={`${
                              INVOICE_STATUS_VARIANTS[inv.status] || 'bg-slate-100'
                            } shadow-none border-0`}
                          >
                            {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Vencimento:{' '}
                            <strong className={isOverdue ? 'text-destructive' : 'text-slate-700'}>
                              {format(parseISO(inv.due_date), 'dd/MM/yyyy')}
                            </strong>
                          </span>
                          <span>Emissão: {format(parseISO(inv.issue_date), 'dd/MM/yyyy')}</span>
                          {inv.expand?.process?.title && (
                            <span className="hidden sm:inline">
                              | Processo: {inv.expand.process.title}
                            </span>
                          )}
                        </div>
                        {inv.status === 'paga' && inv.paid_at && (
                          <div className="text-xs text-emerald-600 mt-2 font-medium bg-emerald-50 inline-block px-2 py-1 rounded">
                            Pago em {format(parseISO(inv.paid_at), 'dd/MM/yyyy')}
                            {inv.payment_method ? ` via ${inv.payment_method}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="text-lg font-bold text-slate-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(inv.total || 0)}
                      </div>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
