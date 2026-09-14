import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Plus,
  PackageOpen,
  FileClock,
  ClipboardList,
  Calendar,
  Scale,
  Clock,
} from 'lucide-react'
import { format, subDays, isSameDay, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'

import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { StatusChip } from '@/components/StatusChip'
import { useRealtime } from '@/hooks/use-realtime'

import {
  getContractsCount,
  getContractsTotalValue,
  getExpiringContracts,
} from '@/services/contracts'
import { getSchedulesCount } from '@/services/os_schedules'
import { getClientsCount } from '@/services/clients'
import { getSuppliersCount } from '@/services/suppliers'
import { getRecentServiceOrders } from '@/services/service_orders'
import { getActivities } from '@/services/activities'
import {
  listUpcomingHearings,
  listOpenDeadlines,
  type ProcessHearing,
  type ProcessDeadline,
} from '@/services/processes'
import { businessDaysDiff } from '@/lib/business-days'

const mapStatusToTone = (status: string): any => {
  const s = (status || '').toLowerCase()
  if (['active', 'vigente'].includes(s)) return 'active'
  if (['expiring', 'vencendo'].includes(s)) return 'expiring'
  if (['expirado', 'closed', 'expired', 'cancelled', 'inactive'].includes(s)) return 'closed'
  if (['rascunho', 'draft'].includes(s)) return 'neutral'
  return 'info'
}

const mapStatusToLabel = (status: string) => {
  const map: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    expired: 'Expirado',
    cancelled: 'Cancelado',
    open: 'Aberto',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
  }
  return map[status] || status
}

export default function Index() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    clients: 0,
    suppliers: 0,
    contracts: 0,
    revenue: 0,
    osHoje: 0,
  })
  const [expiringContracts, setExpiringContracts] = useState<any[]>([])
  const [recentOS, setRecentOS] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [upcomingHearings, setUpcomingHearings] = useState<ProcessHearing[]>([])
  const [openDeadlines, setOpenDeadlines] = useState<ProcessDeadline[]>([])

  const loadData = async () => {
    try {
      const startOfToday = format(new Date(), 'yyyy-MM-dd 00:00:00')
      const endOfToday = format(new Date(), 'yyyy-MM-dd 23:59:59')

      const [
        clients,
        suppliers,
        contracts,
        revenue,
        osHoje,
        expiring,
        os,
        acts,
        hearings,
        deadlines,
      ] = await Promise.all([
        getClientsCount("status='active'"),
        getSuppliersCount("status='active'"),
        getContractsCount("status='active' || (expiry_date != '' && expiry_date > @now)"),
        getContractsTotalValue(),
        getSchedulesCount(
          `starts_at >= '${startOfToday}' && starts_at <= '${endOfToday}' && (status='scheduled' || status='confirmed' || status='in_progress')`,
        ),
        getExpiringContracts(),
        getRecentServiceOrders(),
        getActivities(),
        listUpcomingHearings(7),
        listOpenDeadlines(7),
      ])

      setMetrics({ clients, suppliers, contracts, revenue, osHoje })
      setExpiringContracts(expiring.items || [])
      setRecentOS(os.items || [])
      setUpcomingHearings(hearings || [])
      setOpenDeadlines(deadlines || [])

      const days = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), 29 - i))
      const data = days.map((day) => {
        const count = (acts.items || []).filter((a: any) =>
          isSameDay(parseISO(a.created), day),
        ).length
        return {
          date: format(day, 'dd/MMM', { locale: ptBR }),
          count,
        }
      })
      setChartData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('clients', loadData)
  useRealtime('suppliers', loadData)
  useRealtime('contracts', loadData)
  useRealtime('service_orders', loadData)
  useRealtime('activities', loadData)
  useRealtime('os_schedules', loadData)
  useRealtime('process_hearings', loadData)
  useRealtime('process_deadlines', loadData)

  const getUrgencyInfo = (dueDateStr: string) => {
    const due = parseISO(dueDateStr)
    if (isPast(due) && !isToday(due))
      return { label: 'Vencido', color: 'text-destructive bg-destructive/15' }
    if (isToday(due)) return { label: 'Vence hoje', color: 'text-destructive bg-destructive/15' }
    const days = businessDaysDiff(new Date(), due)
    if (days <= 3)
      return {
        label: `Em ${days} dias úteis`,
        color: 'text-secondary bg-secondary/15',
      }
    return { label: `Em ${days} dias úteis`, color: 'text-primary bg-primary/15' }
  }

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const fmtDate = (str: string) => {
    if (!str) return '-'
    return format(parseISO(str), 'dd/MM/yyyy')
  }

  const relativeTime = (str: string) => {
    if (!str) return '-'
    const date = parseISO(str)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return 'Agora mesmo'
    if (diffInHours < 24) return `Há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
    const diffInDays = Math.floor(diffInHours / 24)
    return `Há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`
  }

  const chartConfig = {
    count: { label: 'Atividades', color: 'hsl(var(--primary))' },
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      <PageHeader
        title="Dashboard"
        subtitle="Visão executiva do ERP"
        actions={
          <Button asChild>
            <Link to="/contratos?new=true">
              <Plus className="mr-2 h-4 w-4" /> Novo contrato
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card
          className="hover:scale-[1.02] transition-transform duration-200 shadow-sm border-l-4 border-l-primary cursor-pointer bg-card"
          onClick={() => (window.location.href = '/agenda?view=day')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">OS Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {metrics.osHoje}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-transform duration-200 shadow-sm border-l-4 border-l-accent bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {metrics.clients}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-transform duration-200 shadow-sm border-l-4 border-l-emerald-500 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {metrics.contracts}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-transform duration-200 shadow-sm border-l-4 border-l-secondary bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {fmtCurrency(metrics.revenue)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-transform duration-200 shadow-sm border-l-4 border-l-destructive bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencendo</CardTitle>
            <PackageOpen className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {expiringContracts.length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm border-border">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg">Contratos próximos do vencimento</CardTitle>
            <CardDescription>Nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : expiringContracts.length > 0 ? (
              <div className="divide-y divide-border">
                {expiringContracts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-secondary/15 p-2">
                        <FileClock className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.expand?.client?.name || 'Sem cliente'} • {fmtDate(c.expiry_date)}
                        </p>
                      </div>
                    </div>
                    <StatusChip tone={mapStatusToTone('expiring')} label="Vencendo" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={PackageOpen}
                title="Nada vencendo"
                description="Nenhum contrato possui vencimento para os próximos 30 dias."
              />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-border">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg">OS recentes</CardTitle>
            <CardDescription>Últimas 5 ordens de serviço</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentOS.length > 0 ? (
              <div className="divide-y divide-border">
                {recentOS.map((os) => (
                  <div
                    key={os.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-accent/15 p-2">
                        <ClipboardList className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{os.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {os.expand?.client?.name || 'Sem cliente'} • {relativeTime(os.created)}
                        </p>
                      </div>
                    </div>
                    <StatusChip
                      tone={mapStatusToTone(os.status)}
                      label={mapStatusToLabel(os.status)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="Sem ordens"
                description="Nenhuma ordem de serviço foi criada recentemente."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm border-border">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg">Prazos da semana</CardTitle>
            <CardDescription>Próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : openDeadlines.length > 0 ? (
              <div className="divide-y divide-border">
                {openDeadlines.map((dl) => {
                  const urgency = getUrgencyInfo(dl.due_date)
                  return (
                    <Link
                      key={dl.id}
                      to={`/processos/${dl.process}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors block"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-destructive/15 p-2">
                          <Clock className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{dl.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {dl.expand?.process?.expand?.client?.name || 'Processo'} •{' '}
                            {fmtDate(dl.due_date)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`font-medium ${urgency.color} shadow-none`}
                      >
                        {urgency.label}
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="Sem prazos"
                description="Nenhum prazo em aberto para os próximos 7 dias."
              />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-border">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-lg">Próximas audiências</CardTitle>
            <CardDescription>Próximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingHearings.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingHearings.map((h) => (
                  <Link
                    key={h.id}
                    to={`/processos/${h.process}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/15 p-2">
                        <Scale className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">
                          Audiência de {h.type?.replace(/_/g, ' ') || 'Processo'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {h.expand?.process?.expand?.client?.name || 'Cliente'} • {fmtDate(h.date)}{' '}
                          {h.time && `às ${h.time}`}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none font-medium">
                      Agendada
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Scale}
                title="Sem audiências"
                description="Nenhuma audiência marcada para os próximos 7 dias."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-lg">Atividade do mês</CardTitle>
          <CardDescription>Volume de atividades nos últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  allowDecimals={false}
                  className="fill-muted-foreground"
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
