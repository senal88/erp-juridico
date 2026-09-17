import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type Expense,
  getReceiptUrl,
} from '@/services/financial'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { EXPENSE_KIND_LABELS } from '@/lib/financial-labels'
import { FileText, Download } from 'lucide-react'

const expenseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  kind: z.enum([
    'custas',
    'cartorio',
    'pericia',
    'copias',
    'transporte',
    'estacionamento',
    'correios',
    'outras',
  ]),
  amount: z.coerce.number().min(0.01, 'Valor é obrigatório'),
  process: z.string().min(1, 'Processo é obrigatório'),
  date_incurred: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
  reimbursable: z.boolean().default(false),
  reimbursed: z.boolean().default(false),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  onSave: () => void
}

export function ExpenseSheet({ open, onOpenChange, expense, onSave }: ExpenseSheetProps) {
  const { toast } = useToast()
  const [processes, setProcesses] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const form = useForm<any>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      title: '',
      kind: 'custas',
      amount: 0,
      process: '',
      date_incurred: '',
      description: '',
      reimbursable: false,
      reimbursed: false,
    },
  })

  const reimbursable = form.watch('reimbursable')

  useEffect(() => {
    if (open) {
      pb.collection('processes').getFullList().then(setProcesses)
      setFile(null)

      if (expense) {
        form.reset({
          title: expense.title,
          kind: expense.kind,
          amount: expense.amount,
          process: expense.process,
          date_incurred: expense.date_incurred.split(' ')[0],
          description: expense.description || '',
          reimbursable: expense.reimbursable || false,
          reimbursed: expense.reimbursed || false,
        })
      } else {
        form.reset({
          title: '',
          kind: 'custas',
          amount: 0,
          process: '',
          date_incurred: new Date().toISOString().split('T')[0],
          description: '',
          reimbursable: false,
          reimbursed: false,
        })
      }
    }
  }, [open, expense, form])

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('kind', values.kind)
      formData.append('amount', values.amount.toString())
      formData.append('process', values.process === 'none' ? '' : values.process)
      formData.append('date_incurred', new Date(values.date_incurred).toISOString())

      formData.append('description', values.description || '')

      formData.append('reimbursable', values.reimbursable ? 'true' : 'false')
      formData.append('reimbursed', values.reimbursed ? 'true' : 'false')

      if (values.reimbursed && (!expense || !expense.reimbursed)) {
        formData.append('reimbursed_at', new Date().toISOString())
      } else if (!values.reimbursed) {
        formData.append('reimbursed_at', '')
      }

      if (!expense) {
        const userId = pb.authStore.record?.id
        if (userId) formData.append('paid_by', userId)
      }

      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('O arquivo excede o limite de 10MB.')
        }
        formData.append('receipt', file)
      }

      if (expense) {
        await updateExpense(expense.id, formData)
        toast({ title: 'Despesa atualizada com sucesso' })
      } else {
        await createExpense(formData)
        toast({ title: 'Despesa registrada com sucesso' })
      }
      onSave()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!expense || !window.confirm('Tem certeza que deseja excluir esta despesa?')) return
    setIsDeleting(true)
    try {
      await deleteExpense(expense.id)
      toast({ title: 'Despesa excluída' })
      onSave()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader>
          <SheetTitle>{expense ? 'Editar Despesa' : 'Nova Despesa'}</SheetTitle>
          <SheetDescription>Registre custos associados a um processo.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cópia de autos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EXPENSE_KIND_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="process"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {processes.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_incurred"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Despesa</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes da despesa..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-lg border border-border p-4 bg-secondary/15">
              <FormField
                control={form.control}
                name="reimbursable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Reembolsável pelo cliente</FormLabel>
                      <FormDescription>
                        Se ativado, esta despesa será cobrada do cliente futuramente.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {reimbursable && (
                <FormField
                  control={form.control}
                  name="reimbursed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Já foi reembolsada?</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Comprovante (Recibo/Nota)</FormLabel>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <FormDescription>Formatos: PDF, JPG, PNG, WEBP. Máx 10MB.</FormDescription>
              {expense?.receipt && !file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <FileText className="w-4 h-4" />
                  <a
                    href={getReceiptUrl(expense) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    Ver comprovante atual
                  </a>
                </div>
              )}
            </div>

            <SheetFooter className="mt-6 flex justify-between sm:justify-between w-full">
              {expense ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  Excluir
                </Button>
              ) : (
                <div />
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Salvar
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
