import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Gavel, Table as TableIcon, LayoutGrid, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getProcesses, updateProcess, type Process } from '@/services/processes'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ProcessSheet } from '@/components/processes/ProcessSheet'
import { STATUS_LABELS, STATUS_VARIANT, AREA_LABELS } from '@/lib/process-labels'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-lg border border-dashed">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
        <Gavel className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Nenhum processo encontrado</h3>
      <p className="text-muted-foreground mt-1 mb-4 max-w-sm">
        Não conseguimos encontrar nenhum processo correspondente aos filtros aplicados.
      </p>
      <Button onClick={onAction} className="bg-gold-gradient shadow-gold-glow hover:opacity-90">
        Criar Novo Processo
      </Button>
    </div>
  )
}

export default function Processos() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')

  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(() => {
    return (localStorage.getItem('processos_view') as 'table' | 'kanban') || 'table'
  })

  useEffect(() => {
    localStorage.setItem('processos_view', viewMode)
  }, [viewMode])

  const loadData = async () => {
    try {
      const data = await getProcesses()
      setProcesses(Array.isArray(data) ? data : (data as any)?.items || [])
    } catch (err) {
      console.error(err)
      setProcesses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    pb.collection('clients')
      .getFullList({ fields: 'id,name', sort: 'name' })
      .then(setClients)
      .catch(console.error)
  }, [])

  useRealtime('processes', () => loadData())

  const filteredProcesses = (Array.isArray(processes) ? processes : []).filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.cnj?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      viewMode === 'kanban' || statusFilter === 'all' || p.status === statusFilter
    const matchesArea = areaFilter === 'all' || p.area === areaFilter
    const matchesClient = clientFilter === 'all' || p.client_id === clientFilter

    return matchesSearch && matchesStatus && matchesArea && matchesClient
  })

  // Kanban Drag and Drop State
  const isDragging = useRef(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    isDragging.current = true
    setDraggingId(id)
  }

  const handleDragEnd = () => {
    setTimeout(() => {
      isDragging.current = false
    }, 100)
    setDraggingId(null)
    setDragOverStatus(null)
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStatus !== status) {
      setDragOverStatus(status)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverStatus(null)
    setDraggingId(null)
    setTimeout(() => {
      isDragging.current = false
    }, 100)

    const processId = e.dataTransfer.getData('text/plain')
    if (!processId) return

    const process = processes.find((p) => p.id === processId)
    if (!process || process.status === newStatus) return

    const oldStatus = process.status

    setProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, status: newStatus as any } : p)),
    )

    try {
      await updateProcess(processId, { status: newStatus as any })
      toast({
        title: 'Sucesso',
        description: `Status atualizado: Movido para ${STATUS_LABELS[newStatus] || newStatus}`,
      })
    } catch (error) {
      setProcesses((prev) =>
        prev.map((p) => (p.id === processId ? { ...p, status: oldStatus } : p)),
      )
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do processo.',
        variant: 'destructive',
      })
    }
  }

  const renderKanban = () => {
    const KANBAN_COLUMNS = [
      'novo',
      'em_andamento',
      'audiencia_marcada',
      'com_sentenca',
      'em_recurso',
      'arquivado',
      'encerrado',
    ] as const

    const STATUS_COLORS: Record<string, string> = {
      novo: 'bg-slate-800',
      em_andamento: 'bg-blue-500',
      audiencia_marcada: 'bg-amber-500',
      com_sentenca: 'bg-purple-500',
      em_recurso: 'bg-orange-500',
      arquivado: 'bg-slate-400',
      encerrado: 'bg-emerald-500',
    }

    return (
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {KANBAN_COLUMNS.map((status) => {
          const columnProcesses = filteredProcesses.filter((p) => (p.status || 'novo') === status)
          const isDragOver = dragOverStatus === status

          return (
            <div
              key={status}
              className={cn(
                'flex-shrink-0 w-[320px] flex flex-col rounded-xl border transition-colors',
                isDragOver
                  ? 'border-primary border-dashed bg-primary/5'
                  : 'border-border bg-slate-50/50',
              )}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="p-3 border-b border-border bg-white rounded-t-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={cn('w-3 h-3 rounded-full', STATUS_COLORS[status] || 'bg-slate-500')}
                  />
                  <h3 className="font-semibold text-slate-700">
                    {STATUS_LABELS[status] || status}
                  </h3>
                </div>
                <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 font-medium">
                  {columnProcesses.length}
                </Badge>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {columnProcesses.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-sm text-slate-400 italic border-2 border-dashed border-slate-200 rounded-lg">
                    Sem processos
                  </div>
                ) : (
                  columnProcesses.map((process) => (
                    <div
                      key={process.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, process.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group',
                        draggingId === process.id ? 'opacity-50' : 'opacity-100',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-slate-300 group-hover:text-slate-500 shrink-0">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-medium text-sm text-slate-900 line-clamp-2 hover:text-primary hover:underline cursor-pointer"
                            onClick={(e) => {
                              if (isDragging.current) {
                                e.preventDefault()
                                return
                              }
                              navigate(`/processos/${process.id}`)
                            }}
                          >
                            {process.title}
                          </div>
                          {process.cnj && (
                            <div className="text-xs font-mono text-slate-500 mt-1 truncate">
                              {process.cnj}
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span
                              className="text-xs text-slate-600 truncate max-w-[120px]"
                              title={process.expand?.client_id?.name}
                            >
                              {process.expand?.client_id?.name || 'Sem cliente'}
                            </span>
                            {process.area && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-normal px-1.5 py-0 border-slate-200"
                              >
                                {AREA_LABELS[process.area] || process.area}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            Resp: {process.expand?.responsible_lawyer_id?.name || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Processos"
        description="Gestão completa dos processos jurídicos do escritório"
        action={
          <>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => {
                if (v) setViewMode(v as 'table' | 'kanban')
              }}
              className="bg-white border rounded-md"
            >
              <ToggleGroupItem value="table" aria-label="Table View">
                <TableIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="kanban" aria-label="Kanban View">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              onClick={() => setSheetOpen(true)}
              className="gap-2 bg-gold-gradient shadow-gold-glow hover:opacity-90 text-white"
            >
              <Plus className="h-4 w-4" /> Novo Processo
            </Button>
          </>
        }
      />

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por título ou CNJ..."
                className="pl-8 bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {viewMode === 'table' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="audiencia_marcada">Audiência marcada</SelectItem>
                    <SelectItem value="com_sentenca">Com sentença</SelectItem>
                    <SelectItem value="em_recurso">Em recurso</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  <SelectItem value="civil">Cível</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="tributario">Tributário</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="previdenciario">Previdenciário</SelectItem>
                  <SelectItem value="consumidor">Consumidor</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredProcesses.length === 0 ? (
            <EmptyState onAction={() => setSheetOpen(true)} />
          ) : viewMode === 'kanban' ? (
            renderKanban()
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CNJ / Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcesses.map((process) => (
                    <TableRow
                      key={process.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => navigate(`/processos/${process.id}`)}
                    >
                      <TableCell className="max-w-[200px] truncate">
                        <div className="font-medium text-slate-900 truncate" title={process.title}>
                          {process.title}
                        </div>
                        {process.cnj ? (
                          <div className="text-xs font-mono text-slate-500 mt-0.5">
                            {process.cnj}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 mt-0.5">Sem CNJ</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {process.expand?.client_id?.name || '-'}
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {process.area ? AREA_LABELS[process.area] || process.area : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${
                            process.status ? STATUS_VARIANT[process.status] : STATUS_VARIANT['novo']
                          } border-transparent font-medium shadow-none hover:opacity-80`}
                        >
                          {process.status
                            ? STATUS_LABELS[process.status] || process.status
                            : 'Indefinido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {process.expand?.responsible_lawyer_id?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
                        {format(new Date(process.created), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProcessSheet open={sheetOpen} onOpenChange={setSheetOpen} process={null} />
    </div>
  )
}
