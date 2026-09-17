import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Clock, DollarSign, ChevronRight, CalendarDays } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { businessDaysDiff } from '@/lib/business-days'

import type { Process, ProcessHearing, ProcessDeadline } from '@/services/processes'
import type { Invoice } from '@/services/financial'

export default function PortalDashboard() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [hearings, setHearings] = useState<ProcessHearing[]>([])
  const [deadlines, setDeadlines] = useState<ProcessDeadline[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [assetCount, setAssetCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date()
        const end = new Date()
        end.setDate(today.getDate() + 30)

        const todayStr = format(today, 'yyyy-MM-dd')
        const endStr = format(end, 'yyyy-MM-dd')

        const [procData, hearData, deadData, invData, assetData] = await Promise.all([
          pb.collection('processes').getFullList<Process>({ sort: '-created' }),
          pb.collection('process_hearings').getFullList<ProcessHearing>({
            expand: 'process_id',
            sort: 'date,time',
            filter: `date >= "${todayStr}" && date <= "${endStr}" && status = 'agendada'`,
          }),
          pb.collection('process_deadlines').getFullList<ProcessDeadline>({
            expand: 'process_id',
            sort: 'due_date',
            filter: `due_date >= "${todayStr}" && due_date <= "${endStr}" && status = 'aberto'`,
          }),
          pb.collection('invoices').getFullList<Invoice>({ sort: '-due_date' }),
          pb
            .collection('patrimonial_assets')
            .getList(1, 1)
            .catch(() => ({ totalItems: 0 })),
        ])

        setProcesses(procData)
        setHearings(hearData)
        setDeadlines(deadData)
        setInvoices(invData)
        setAssetCount(assetData.totalItems)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const activeProcesses = processes.filter(
    (p) => p.status !== 'arquivado' && p.status !== 'encerrado',
  ).length
  const pendingInvoices = invoices.filter((i) => i.status === 'enviada' || i.status === 'vencida')
  const pendingAmount = pendingInvoices.reduce((acc, i) => acc + (i.total || 0), 0)

  const getUrgencyBadge = (due_date: string) => {
    const due = parseISO(due_date)
    if (isPast(due) && !isToday(due)) {
      return (
        <Badge variant="destructive" className="shadow-none">
          Vencido
        </Badge>
      )
    }
    if (isToday(due)) {
      return (
        <Badge variant="destructive" className="shadow-none">
          Hoje
        </Badge>
      )
    }
    const days = businessDaysDiff(new Date(), due)
    if (days <= 3) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 shadow-none">
          Em {days} d.u.
        </Badge>
      )
    }
    return (
      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 shadow-none">
        Em {days} d.u.
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/portal/processos">Ver Processos</Link>
          </Button>
          <Button asChild>
            <Link to="/portal/faturas">Acessar Faturas</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/portal/patrimonio">Meu Patrimônio</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProcesses}</div>
            <p className="text-xs text-muted-foreground">Processos em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Audiências</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hearings.length}</div>
            <p className="text-xs text-muted-foreground">Agendadas para os próximos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prazos Abertos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deadlines.length}</div>
            <p className="text-xs text-muted-foreground">Vencimentos nos próximos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                pendingAmount,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingInvoices.length} fatura(s) aguardando pagamento
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Patrimônio</CardTitle>
            <Link to="/portal/patrimonio" className="text-primary hover:opacity-80">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{assetCount}</div>
            <p className="text-xs text-muted-foreground">
              {assetCount === 1 ? 'Ativo mapeado' : 'Ativos mapeados'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Próximas Audiências</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/portal/processos">
                Ver Todas <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {hearings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CalendarDays className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p>Nenhuma audiência próxima.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hearings.slice(0, 4).map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start gap-4 p-3 rounded-lg border bg-slate-50/50"
                  >
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white rounded-md w-12 h-12 border shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">
                        {format(parseISO(h.date), 'MMM', { locale: ptBR })}
                      </span>
                      <span className="text-lg font-bold text-primary leading-none mt-1">
                        {format(parseISO(h.date), 'dd')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {h.expand?.process_id?.title || 'Processo não informado'}
                      </p>
                      <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {h.time || 'A definir'}
                        </span>
                        {h.vara && <span>• {h.vara}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Prazos Importantes</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/portal/processos">
                Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p>Nenhum prazo próximo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deadlines.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-slate-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                        {getUrgencyBadge(d.due_date)}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {d.expand?.process_id?.title || 'Processo não informado'}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-slate-600 whitespace-nowrap bg-white px-2 py-1 rounded border shadow-sm">
                      {format(parseISO(d.due_date), 'dd/MM/yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
