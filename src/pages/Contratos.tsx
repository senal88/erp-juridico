import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArchiveRestore,
  Download,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { differenceInDays, parseISO, startOfDay } from 'date-fns'
import { ContractSheet } from '@/components/ContractSheet'
import { StatusChip } from '@/components/StatusChip'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import pb from '@/lib/pocketbase/client'
import { PageHeader } from '@/components/PageHeader'

export default function Contratos() {
  const { toast } = useToast()
  const [data, setData] = useState<any>({ items: [], totalPages: 1 })
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)

  const [selectedContract, setSelectedContract] = useState<any>(null)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    pb.collection('clients').getFullList({ sort: 'name' }).then(setClients).catch(console.error)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const filters = []

      if (showArchived) {
        filters.push(`archived = true`)
      } else {
        filters.push(`(archived = false || archived = null)`)
      }

      if (statusFilter !== 'all') filters.push(`status='${statusFilter}'`)
      if (clientFilter !== 'all') filters.push(`client_id='${clientFilter}'`)
      if (debouncedSearch)
        filters.push(`(title~'${debouncedSearch}' || expand.client_id.name~'${debouncedSearch}')`)

      const res = await pb.collection('contracts').getList(page, 10, {
        sort: '-created',
        expand: 'client_id',
        filter: filters.join(' && '),
      })
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, statusFilter, clientFilter, typeFilter, debouncedSearch, showArchived])

  useRealtime('contracts', loadData)

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const fmtDate = (str: string) => {
    if (!str) return '-'
    return new Date(str).toLocaleDateString('pt-BR')
  }

  const getDerivedStatus = (c: any) => {
    if (!c) return 'inactive'
    const dateStr = c.vigencia_fim || c.expiry_date
    if (c.status !== 'active' || !dateStr) return c.status
    const days = differenceInDays(parseISO(dateStr), startOfDay(new Date()))
    if (days >= 0 && days <= 30) return 'expiring'
    return c.status
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = data.items.map((i: any) => i.id)
      setSelectedIds(Array.from(new Set([...selectedIds, ...newIds])))
    } else {
      const currentIds = data.items.map((i: any) => i.id)
      setSelectedIds(selectedIds.filter((id) => !currentIds.includes(id)))
    }
  }

  const isAllSelected =
    data.items.length > 0 && data.items.every((i: any) => selectedIds.includes(i.id))

  const handleBulkAction = async (
    action: 'status' | 'archive' | 'unarchive' | 'delete',
    payload?: any,
  ) => {
    if (selectedIds.length === 0) return
    if (
      action === 'delete' &&
      !confirm('Tem certeza que deseja excluir os registros selecionados permanentemente?')
    )
      return

    setIsProcessingBulk(true)
    let success = 0
    let failed = 0

    for (const id of selectedIds) {
      try {
        if (action === 'status') {
          await pb.collection('contracts').update(id, { status: payload })
        } else if (action === 'archive') {
          await pb
            .collection('contracts')
            .update(id, { archived: true, archived_at: new Date().toISOString() })
        } else if (action === 'unarchive') {
          await pb.collection('contracts').update(id, { archived: false, archived_at: null })
        } else if (action === 'delete') {
          await pb.collection('contracts').delete(id)
        }
        success++
      } catch (err) {
        failed++
      }
    }

    toast({
      title: 'Ação concluída',
      description: `${success} item(ns) processado(s) com sucesso. ${failed > 0 ? `${failed} falha(s).` : ''}`,
      variant: failed > 0 ? 'destructive' : 'default',
    })

    setSelectedIds([])
    setIsProcessingBulk(false)
    loadData()
  }

  const handleExportCsv = async () => {
    setIsProcessingBulk(true)
    try {
      const records = await Promise.all(
        selectedIds.map((id) => pb.collection('contracts').getOne(id)),
      )
      const headers = [
        'id',
        'title',
        'value',
        'vigencia_inicio',
        'vigencia_fim',
        'status',
        'created',
      ]

      const csvRows = records.map((r) => {
        return headers.map((h) => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(',')
      })

      const csvString = [headers.join(','), ...csvRows].join('\n')
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `contratos-${Date.now()}.csv`
      link.click()

      toast({ title: 'Exportação concluída' })
      setSelectedIds([])
    } catch (err) {
      toast({ title: 'Erro ao exportar CSV', variant: 'destructive' })
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const renderPagination = () => {
    const pages = []
    for (let i = 1; i <= data.totalPages; i++) {
      pages.push(
        <Button
          key={i}
          variant="outline"
          className={`w-9 h-9 p-0 rounded-lg ${page === i ? 'bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90 hover:text-white' : ''}`}
          onClick={() => setPage(i)}
        >
          {i}
        </Button>,
      )
    }
    return (
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button
          variant="outline"
          className="w-9 h-9 p-0 rounded-lg"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages}
        <Button
          variant="outline"
          className="w-9 h-9 p-0 rounded-lg"
          disabled={page === data.totalPages || data.totalPages === 0}
          onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-8 relative min-h-screen">
      <PageHeader
        title="Contratos"
        description="Gestão de contratos, aditivos e vencimentos"
        action={
          <Button className="bg-secondary hover:bg-secondary/90 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Novo contrato
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar contratos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-2 mr-2">
            <Switch id="archived-mode" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="archived-mode" className="text-sm font-medium cursor-pointer">
              Arquivados
            </Label>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="expired">Vencido</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={clientFilter}
            onValueChange={(v) => {
              setClientFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Clientes</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md overflow-hidden h-10">
            <Button
              variant="ghost"
              className={`h-full rounded-none px-3 border-0 ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className={`h-full rounded-none px-3 border-0 border-l ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        viewMode === 'list' ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        )
      ) : viewMode === 'list' ? (
        <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[40px] pl-4">
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                </TableHead>
                <TableHead className="pl-2">Cliente</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="pr-6 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((c: any) => (
                <TableRow
                  key={c.id}
                  className={`cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(c.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  onClick={() => setSelectedContract(c)}
                >
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(c.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds([...selectedIds, c.id])
                        else setSelectedIds(selectedIds.filter((id) => id !== c.id))
                      }}
                    />
                  </TableCell>
                  <TableCell className="pl-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={pb.files.getUrl(c.expand?.client_id, c.expand?.client_id?.avatar)}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {c.expand?.client_id?.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {c.expand?.client_id?.name || 'Sem Cliente'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{c.title}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400 font-medium tabular-nums">
                    {fmtCurrency(c.value)}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {fmtDate(c.vigencia_fim || c.expiry_date)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <StatusChip status={getDerivedStatus(c)} />
                  </TableCell>
                </TableRow>
              ))}
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((c: any) => (
            <Card
              key={c.id}
              className={`cursor-pointer hover:shadow-md transition-all relative dark:bg-slate-900 ${selectedIds.includes(c.id) ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950' : ''}`}
              onClick={() => setSelectedContract(c)}
            >
              <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(c.id)}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedIds([...selectedIds, c.id])
                    else setSelectedIds(selectedIds.filter((id) => id !== c.id))
                  }}
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start pr-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={pb.files.getUrl(c.expand?.client_id, c.expand?.client_id?.avatar)}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {c.expand?.client_id?.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold pr-4">
                        {c.expand?.client_id?.name || 'Sem Cliente'}
                      </CardTitle>
                      <p className="text-sm text-slate-500 line-clamp-1">{c.title}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Valor</p>
                    <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {fmtCurrency(c.value)}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-slate-500">Vencimento</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {fmtDate(c.vigencia_fim || c.expiry_date)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <StatusChip status={getDerivedStatus(c)} />
                </div>
              </CardContent>
            </Card>
          ))}
          {data.items.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border">
              Nenhum contrato encontrado.
            </div>
          )}
        </div>
      )}

      {!isLoading && data.totalPages > 1 && renderPagination()}

      <ContractSheet
        contract={selectedContract}
        open={!!selectedContract}
        onOpenChange={(val: boolean) => !val && setSelectedContract(null)}
      />

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        isProcessing={isProcessingBulk}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem onClick={() => handleBulkAction('status', 'active')}>
              Ativo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction('status', 'expired')}>
              Vencido
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction('status', 'cancelled')}>
              Cancelado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!showArchived ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleBulkAction('archive')}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0"
          >
            <Archive className="h-4 w-4 mr-2" />
            Arquivar
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleBulkAction('unarchive')}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0"
          >
            <ArchiveRestore className="h-4 w-4 mr-2" />
            Desarquivar
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleBulkAction('delete')}
          className="border-0"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </BulkActionsBar>
    </div>
  )
}
