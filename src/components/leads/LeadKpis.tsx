import { Lead, isLeadOverdue } from '@/services/leads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, DollarSign, AlertCircle, TrendingUp } from 'lucide-react'

interface Props {
  leads: Lead[]
}

export function LeadKpis({ leads }: Props) {
  const openLeads = leads.filter((l) => l.status !== 'ganho' && l.status !== 'perdido')
  const pipelineValue = openLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0)
  const overdueCount = openLeads.filter(isLeadOverdue).length

  const now = new Date()
  const wonThisMonth = leads.filter((l) => {
    if (l.status !== 'ganho') return false
    const d = new Date(l.updated)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Leads Abertos</CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openLeads.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline (R$)</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBRL(pipelineValue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Follow-up Atrasado
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ganhos no Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{wonThisMonth}</div>
        </CardContent>
      </Card>
    </div>
  )
}
