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
import { createFee, updateFee, deleteFee, type Fee } from '@/services/financial'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  FEE_KIND_LABELS,
  FEE_STATUS_LABELS,
  FEE_BILLING_BASIS_LABELS,
  FEE_RECURRENCE_LABELS,
} from '@/lib/financial-labels'

const feeSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  kind: z.enum(['fixo', 'exito', 'recorrente', 'sucumbencial', 'consulta']),
  recurrence: z.enum(['unica', 'mensal', 'trimestral', 'anual']).optional().default('unica'),
  client: z.string().min(1, 'Cliente é obrigatório'),
  process: z.string().optional(),
  status: z.enum(['pendente', 'cobrado', 'recebido', 'cancelado']),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  amount: z.coerce.number().optional(),
  percentage: z.coerce.number().optional(),
  billing_basis: z
    .enum(['valor_causa', 'acordo', 'condenacao', 'valor_contratado', 'outra'])
    .optional(),
})

type FeeFormValues = z.infer<typeof feeSchema>

interface FeeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fee: Fee | null
  onSave: () => void
}

export function FeeSheet({ open, onOpenChange, fee, onSave }: FeeSheetProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [processes, setProcesses] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      title: '',
      kind: 'fixo',
      recurrence: 'unica',
      client: '',
      process: 'none',
      status: 'pendente',
      due_date: '',
      notes: '',
      amount: 0,
      percentage: 0,
      billing_basis: 'valor_causa',
    },
  })

  const kind = form.watch('kind')

  useEffect(() => {
    if (open) {
      pb.collection('clients').getFullList().then(setClients)
      pb.collection('processes').getFullList().then(setProcesses)

      if (fee) {
        form.reset({
          title: fee.title,
          kind: fee.kind,
          recurrence: fee.recurrence || 'unica',
          client: fee.client,
          process: fee.process || 'none',
          status: fee.status,
          due_date: fee.due_date ? fee.due_date.split(' ')[0] : '',
          notes: fee.notes || '',
          amount: fee.amount || 0,
          percentage: fee.percentage || 0,
          billing_basis: fee.billing_basis || 'valor_causa',
        })
      } else {
        form.reset({
          title: '',
          kind: 'fixo',
          recurrence: 'unica',
          client: '',
          process: 'none',
          status: 'pendente',
          due_date: '',
          notes: '',
          amount: 0,
          percentage: 0,
          billing_basis: 'valor_causa',
        })
      }
    }
  }, [open, fee, form])

  const onSubmit = async (values: FeeFormValues) => {
    try {
      const data: Partial<Fee> = {
        title: values.title,
        kind: values.kind,
        recurrence: values.recurrence,
        client: values.client,
        process: values.process && values.process !== 'none' ? values.process : '',
        status: values.status,
        due_date: values.due_date ? new Date(values.due_date).toISOString() : undefined,
        notes: values.notes || '',
        amount: ['exito', 'sucumbencial'].includes(values.kind) ? undefined : values.amount,
        percentage: ['exito', 'sucumbencial'].includes(values.kind) ? values.percentage : undefined,
        billing_basis: ['exito', 'sucumbencial'].includes(values.kind)
          ? values.billing_basis
          : undefined,
      }

      if (values.status === 'recebido' && (!fee || fee.status !== 'recebido')) {
        data.received_at = new Date().toISOString()
      } else if (values.status !== 'recebido') {
        data.received_at = '' // Clear if changed from recebido
      }

      if (fee) {
        await updateFee(fee.id, data)
        toast({ title: 'Honorário atualizado com sucesso' })
      } else {
        await createFee(data)
        toast({ title: 'Honorário criado com sucesso' })
      }
      onSave()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!fee || !window.confirm('Tem certeza que deseja excluir este honorário?')) return
    setIsDeleting(true)
    try {
      await deleteFee(fee.id)
      toast({ title: 'Honorário excluído' })
      onSave()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const showPercentage = ['exito', 'sucumbencial'].includes(kind)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full">
        <SheetHeader>
          <SheetTitle>{fee ? 'Editar Honorário' : 'Novo Honorário'}</SheetTitle>
          <SheetDescription>Preencha os dados do honorário abaixo.</SheetDescription>
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
                    <Input placeholder="Ex: Honorários Iniciais" {...field} />
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
                        {Object.entries(FEE_KIND_LABELS).map(([k, v]) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FEE_STATUS_LABELS).map(([k, v]) => (
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
            </div>

            {showPercentage ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billing_basis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base de cálculo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FEE_BILLING_BASIS_LABELS).map(([k, v]) => (
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
              </div>
            ) : (
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
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FEE_RECURRENCE_LABELS).map(([k, v]) => (
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
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
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
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
              name="process"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o processo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="mt-6 flex justify-between sm:justify-between w-full">
              {fee ? (
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
