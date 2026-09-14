import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Timer, Coins, Edit, Trash, Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import { getTimeEntries, deleteTimeEntry, type TimeEntry } from '@/services/time_entries'
import { formatMinutes, sumMinutes, sumBillableAmount } from '@/lib/time_utils'
import { TimeEntrySheet } from '@/components/TimeEntrySheet'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/PageHeader'

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const CAT_MAP: Record<string, { label: string; color: string }> = {
  drafting: { label: 'Redação', color: 'bg-blue-100 text-blue-800' },
  hearing: { label: 'Audiência', color: 'bg-purple-100 text-purple-800' },
  meeting: { label: 'Reunião', color: 'bg-indigo-100 text-indigo-800' },
  research: { label: 'Pesquisa', color: 'bg-cyan-100 text-cyan-800' },
  phone: { label: 'Ligação', color: 'bg-green-100 text-green-800' },
  email: { label: 'E-mail', color: 'bg-yellow-100 text-yellow-800' },
  other: { label: 'Outro', color: 'bg-gray-100 text-gray-800' },
}

const STAT_MAP: Record<string, { label: string; color: string }> = {
  registrada: { label: 'Registrada', color: 'bg-blue-100 text-blue-800' },
  cobrada: { label: 'Cobrada', color: 'bg-green-100 text-green-800' },
  descartada: { label: 'Descartada', color: 'bg-red-100 text-red-800' },
}

export default function HorasPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [catFilter, setCatFilter] = useState('_all_')
  const [statusFilter, setStatusFilter] = useState('_all_')
  const [billableFilter, setBillableFilter] = useState('_all_')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(t)
  }, [search])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getTimeEntries(1, 1000, '')
      setEntries(res.items)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return
    try {
      await deleteTimeEntry(id)
      toast({ title: 'Sucesso', description: 'Registro excluído.' })
      loadData()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (debouncedSearch && !e.description?.toLowerCase().includes(debouncedSearch.toLowerCase()))
        return false
      if (catFilter !== '_all_' && e.category !== catFilter) return false
      if (statusFilter !== '_all_' && e.status !== statusFilter) return false
      if (billableFilter !== '_all_' && e.is_billable !== (billableFilter === 'yes')) return false
      return true
    })
  }, [entries, debouncedSearch, catFilter, statusFilter, billableFilter])

  const kpis = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthE = entries.filter((e) => new Date(e.date) >= startOfMonth)
    const pendingE = entries.filter((e) => e.status === 'registrada' && e.is_billable)
    return {
      monthHours: formatMinutes(sumMinutes(monthE)),
      monthValue: sumBillableAmount(monthE),
      pendingHours: formatMinutes(sumMinutes(pendingE)),
      pendingValue: sumBillableAmount(pendingE),
    }
  }, [entries])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Horas"
        description="Registro de horas trabalhadas por processo e cliente"
        action={
          <Button
            onClick={() => {
              setEditingEntry(null)
              setSheetOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Registrar horas
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { title: 'Horas no Mês', value: kpis.monthHours },
          { title: 'Valor Estimado (Mês)', value: formatBRL(kpis.monthValue) },
          { title: 'Horas a Faturar', value: kpis.pendingHours },
          { title: 'Valor a Faturar', value: formatBRL(kpis.pendingValue) },
        ].map((k) => (
          <Card key={k.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{k.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle>Histórico de Horas</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pela descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todas</SelectItem>
                {Object.entries(CAT_MAP).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todos</SelectItem>
                {Object.entries(STAT_MAP).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={billableFilter} onValueChange={setBillableFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Faturável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todos</SelectItem>
                <SelectItem value="yes">Cobráveis</SelectItem>
                <SelectItem value="no">Não Cobráveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente/Processo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((e) => (
                    <TableRow
                      key={e.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setEditingEntry(e)
                        setSheetOpen(true)
                      }}
                    >
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(e.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{e.description}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                        {e.expand?.client?.name || '-'}{' '}
                        {e.expand?.process?.title && `/ ${e.expand.process.title}`}
                      </TableCell>
                      <TableCell>
                        {e.category && CAT_MAP[e.category] ? (
                          <Badge variant="outline" className={CAT_MAP[e.category].color}>
                            {CAT_MAP[e.category].label}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          {formatMinutes(e.duration_minutes)}
                          {e.is_billable && (
                            <Coins className="w-4 h-4 text-amber-500" title="Cobrável" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {e.status && STAT_MAP[e.status] ? (
                          <Badge variant="outline" className={STAT_MAP[e.status].color}>
                            {STAT_MAP[e.status].label}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-2"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEntry(e)
                              setSheetOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <TimeEntrySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entry={editingEntry}
        onSave={loadData}
      />
    </div>
  )
}
