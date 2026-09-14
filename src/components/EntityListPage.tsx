import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

import { PageHeader } from './PageHeader'
import { StatusChip } from './StatusChip'
import { EmptyState } from './EmptyState'

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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpf_cnpj: z.string().optional(),
  emails: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  address: z.string().optional(),
})

const supplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  service_type: z.string().optional(),
  contact: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  sla: z.string().optional(),
})

export interface EntityListPageProps {
  collection: 'clients' | 'suppliers'
  title: string
  singular: string
  icon?: React.ElementType
  newAction?: () => void
}

export function EntityListPage({
  collection,
  title,
  singular,
  icon,
  newAction,
}: EntityListPageProps) {
  const { toast } = useToast()

  const [data, setData] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const perPage = 25

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handler)
  }, [search])

  const load = async () => {
    let filter = ''
    const conditions = []
    if (debouncedSearch) {
      if (collection === 'clients') {
        conditions.push(`(name ~ "${debouncedSearch}" || cpf_cnpj ~ "${debouncedSearch}")`)
      } else {
        conditions.push(`(name ~ "${debouncedSearch}" || cnpj ~ "${debouncedSearch}")`)
      }
    }
    if (statusFilter !== 'all') {
      conditions.push(`status = "${statusFilter}"`)
    }
    filter = conditions.join(' && ')

    try {
      const res = await pb
        .collection(collection)
        .getList(page, perPage, { sort: '-updated', filter })
      setData(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
  }, [collection, page, debouncedSearch, statusFilter])

  useRealtime(collection, () => {
    load()
  })

  const schema = useMemo(
    () => (collection === 'clients' ? clientSchema : supplierSchema),
    [collection],
  )
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues:
      collection === 'clients'
        ? { name: '', cpf_cnpj: '', emails: '', phone: '', status: 'active', address: '' }
        : { name: '', cnpj: '', service_type: '', contact: '', status: 'active', sla: '' },
  })

  const openCreate = () => {
    setEditingId(null)
    form.reset(
      collection === 'clients'
        ? { name: '', cpf_cnpj: '', emails: '', phone: '', status: 'active', address: '' }
        : { name: '', cnpj: '', service_type: '', contact: '', status: 'active', sla: '' },
    )
    setIsSheetOpen(true)
  }

  const openEdit = (item: any) => {
    setEditingId(item.id)
    form.reset(item)
    setIsSheetOpen(true)
  }

  const onSubmit = async (values: any) => {
    try {
      if (editingId) {
        await pb.collection(collection).update(editingId, values)
        toast({ title: 'Sucesso', description: `${singular} atualizado com sucesso.` })
      } else {
        await pb.collection(collection).create(values)
        toast({ title: 'Sucesso', description: `${singular} criado com sucesso.` })
      }
      setIsSheetOpen(false)
    } catch (err: any) {
      const fieldErrors = extractFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg as string })
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar o registro.',
          variant: 'destructive',
        })
      }
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await pb.collection(collection).delete(deleteId)
      toast({ title: 'Sucesso', description: 'Registro excluído com sucesso.' })
      setDeleteId(null)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    }
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={title}
        icon={icon}
        actions={
          <Button
            onClick={newAction || openCreate}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo {singular}
          </Button>
        }
      />

      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="pt-4 mt-4 border-t flex gap-4 animate-in slide-in-from-top-2">
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead className="pl-6">Nome</TableHead>
              <TableHead>Tipo / CNPJ-CPF</TableHead>
              <TableHead>Email + Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="pr-6 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="pl-6">
                    <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                  </TableCell>
                  <TableCell>
                    {collection === 'clients' ? (
                      <div className="text-slate-600">{item.cpf_cnpj || '-'}</div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-medium">{item.cnpj || '-'}</span>
                        <span className="text-xs text-slate-500">{item.service_type || '-'}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="text-slate-700">
                        {collection === 'clients'
                          ? item.emails || item.email || '-'
                          : item.contact || '-'}
                      </span>
                      {collection === 'clients' && (
                        <span className="text-slate-500">{item.phone || '-'}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={item.status} />
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {item.updated
                      ? format(new Date(item.updated), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24">
                  <EmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t">
            <Button
              variant="outline"
              className="w-9 h-9 p-0 rounded-lg"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {pages.map((p) => (
              <Button
                key={p}
                variant={page === p ? 'secondary' : 'outline'}
                className={cn(
                  'w-9 h-9 p-0 rounded-lg',
                  page === p ? 'bg-secondary text-secondary-foreground' : 'border hover:bg-muted',
                )}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              className="w-9 h-9 p-0 rounded-lg"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? `Editar ${singular}` : `Novo ${singular}`}</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {collection === 'clients' && (
                <>
                  <FormField
                    control={form.control}
                    name="cpf_cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mails</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {collection === 'suppliers' && (
                <>
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Serviço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SLA</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
