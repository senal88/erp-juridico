import { useEffect, useState, useCallback } from 'react'
import { getServiceOrdersPage, deleteServiceOrder } from '@/services/service_orders'
import { getUsers } from '@/services/users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRealtime } from '@/hooks/use-realtime'
import { PageHeader } from '@/components/PageHeader'
import { StatusChip } from '@/components/StatusChip'
import { PriorityChip } from '@/components/PriorityChip'
import { OSModal } from '@/components/OSModal'
import { ExecutionSheet } from '@/components/ExecutionSheet'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CalendarDays,
  Archive,
  ArchiveRestore,
  Download,
  UserPlus,
  CheckCircle2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import pb from '@/lib/pocketbase/client'

export default function OrdensDeServico() {
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error)
  }, [])

  const load = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true)
      try {
        const res = await getServiceOrdersPage({
          page,
          perPage: 25,
          search: debouncedSearch,
          status: statusFilter,
          priority: priorityFilter,
          showArchived,
        })
        setOrders(res.items)
        setTotalPages(res.totalPages)
      } catch (e: any) {
        if (e?.status !== 0 && !e?.isAbort) {
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar as ordens de serviço.',
            variant: 'destructive',
          })
        }
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [page, debouncedSearch, statusFilter, priorityFilter, showArchived, toast],
  )

  useEffect(() => {
    load(true)
  }, [load])

  useRealtime('service_orders', () => load(false))

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
      try {
        await deleteServiceOrder(id)
        toast({ title: 'Sucesso', description: 'OS excluída com sucesso.' })
        load()
      } catch (e: any) {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' })
      }
    }
  }

  const openSheet = (order: any) => {
    setSelectedOrder(order)
    setIsSheetOpen(true)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = orders.map((o) => o.id)
      setSelectedIds(Array.from(new Set([...selectedIds, ...newIds])))
    } else {
      const currentIds = orders.map((o) => o.id)
      setSelectedIds(selectedIds.filter((id) => !currentIds.includes(id)))
    }
  }

  const isAllSelected = orders.length > 0 && orders.every((o) => selectedIds.includes(o.id))

  const handleBulkAction = async (
    action: 'status' | 'assign' | 'archive' | 'unarchive' | 'delete',
    payload?: any,
  ) => {
    if (selectedIds.length === 0) return
    if (
      action === 'delete' &&
      !confirm('Tem certeza que deseja excluir as ordens selecionadas permanentemente?')
    )
      return

    setIsProcessingBulk(true)
    let success = 0
    let failed = 0

    for (const id of selectedIds) {
      try {
        if (action === 'status') {
          await pb.collection('service_orders').update(id, { status: payload })
        } else if (action === 'assign') {
          await pb.collection('service_orders').update(id, { assigned_to: payload })
        } else if (action === 'archive') {
          await pb
            .collection('service_orders')
            .update(id, { archived: true, archived_at: new Date().toISOString() })
        } else if (action === 'unarchive') {
          await pb.collection('service_orders').update(id, { archived: false, archived_at: null })
        } else if (action === 'delete') {
          await pb.collection('service_orders').delete(id)
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
    load()
  }

  const handleExportCsv = async () => {
    setIsProcessingBulk(true)
    try {
      const records = await Promise.all(
        selectedIds.map((id) => pb.collection('service_orders').getOne(id)),
      )
      const headers = ['id', 'title', 'description', 'status', 'priority', 'assigned_to', 'created']

      const csvRows = records.map((r) => {
        return headers.map((h) => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(',')
      })

      const csvString = [headers.join(','), ...csvRows].join('\n')
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `ordens-servico-${Date.now()}.csv`
      link.click()

      toast({ title: 'Exportação concluída' })
      setSelectedIds([])
    } catch (err) {
      toast({ title: 'Erro ao exportar CSV', variant: 'destructive' })
    } finally {
      setIsProcessingBulk(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10 relative min-h-screen">
      <PageHeader title="Ordens de Serviço">
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Nova OS</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white dark:bg-slate-900 p-3 rounded-xl border shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto items-center">
          <div className="flex items-center space-x-2 mr-2">
            <Switch id="os-archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label
              htmlFor="os-archived"
              className="text-sm font-medium cursor-pointer whitespace-nowrap"
            >
              Arquivados
            </Label>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="open">Em Aberto</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Prioridades</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead className="w-[40px] pl-4">
                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead className="pl-2 w-[25%] font-semibold">Título</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Prioridade</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="pr-6 text-right w-[80px] font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="pl-2">
                    <Skeleton className="h-5 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-1/2" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[100px] rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px] rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length > 0 ? (
              orders.map((o) => (
                <TableRow
                  key={o.id}
                  className={`cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group ${selectedIds.includes(o.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                  onClick={() => openSheet(o)}
                >
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(o.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds([...selectedIds, o.id])
                        else setSelectedIds(selectedIds.filter((id) => id !== o.id))
                      }}
                    />
                  </TableCell>
                  <TableCell className="pl-2 font-medium">{o.title}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {o.expand?.client_id?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={o.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={o.priority} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Avatar className="h-7 w-7 border">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${o.assigned_to || o.id}`}
                        />
                        <AvatarFallback>R</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(o.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            openSheet(o)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Editar / Executar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(o.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarDays className="h-8 w-8 text-slate-300" />
                    <p>Nenhuma ordem de serviço encontrada com os filtros atuais.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-[100px] rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : orders.length > 0 ? (
          orders.map((o) => (
            <Card
              key={o.id}
              className={`overflow-hidden transition-all relative cursor-pointer border shadow-sm ${selectedIds.includes(o.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              onClick={() => openSheet(o)}
            >
              <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(o.id)}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedIds([...selectedIds, o.id])
                    else setSelectedIds(selectedIds.filter((id) => id !== o.id))
                  }}
                />
              </div>
              <CardContent className="p-4 space-y-3 pt-6">
                <div className="flex justify-between items-start gap-2 pr-6">
                  <h3 className="font-medium text-slate-900 dark:text-white leading-tight line-clamp-2">
                    {o.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={o.status} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                  {o.expand?.client_id?.name || 'Cliente não informado'}
                </p>
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <PriorityChip priority={o.priority} />
                    <span className="text-xs text-slate-500 flex items-center gap-1 ml-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(o.created), 'dd/MM', { locale: ptBR })}
                    </span>
                  </div>
                  <Avatar className="h-7 w-7 border">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${o.assigned_to || o.id}`}
                    />
                    <AvatarFallback>R</AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 border rounded-xl bg-white dark:bg-slate-900 border-dashed flex flex-col items-center gap-2">
            <CalendarDays className="h-8 w-8 text-slate-300" />
            <p>Nenhuma OS encontrada.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6 justify-center">
          <PaginationContent className="bg-white dark:bg-slate-900 px-2 py-1 rounded-full border shadow-sm">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm font-medium text-slate-600 px-4">
                Página {page} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={
                  page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <OSModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={load} />
      <ExecutionSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        order={selectedOrder}
        onUpdate={load}
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
            <DropdownMenuItem onClick={() => handleBulkAction('status', 'open')}>
              Em Aberto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction('status', 'in_progress')}>
              Em Andamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction('status', 'completed')}>
              Concluída
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0 hidden sm:flex"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Atribuir
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="max-h-[300px] overflow-y-auto">
            {users.map((u) => (
              <DropdownMenuItem key={u.id} onClick={() => handleBulkAction('assign', u.id)}>
                {u.name || u.email}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {!showArchived ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleBulkAction('archive')}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0"
          >
            <Archive className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Arquivar</span>
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleBulkAction('unarchive')}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0"
          >
            <ArchiveRestore className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Desarquivar</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0"
        >
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleBulkAction('delete')}
          className="border-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </BulkActionsBar>
    </div>
  )
}
