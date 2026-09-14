import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/financial-labels'
import { type InvoiceItem } from '@/services/financial'

const schema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.coerce.number().int().min(1, 'Quantidade mínima é 1'),
  unit_price: z.coerce.number().min(0, 'Valor não pode ser negativo'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InvoiceItem | null
  onSave: (item: InvoiceItem) => void
}

export function InvoiceItemDialog({ open, onOpenChange, item, onSave }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      quantity: 1,
      unit_price: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })
      } else {
        form.reset({
          description: '',
          quantity: 1,
          unit_price: 0,
        })
      }
    }
  }, [open, item, form])

  const qty = form.watch('quantity')
  const price = form.watch('unit_price')
  const total = (qty || 0) * (price || 0)

  const onSubmit = (values: FormValues) => {
    onSave({
      description: values.description,
      quantity: values.quantity,
      unit_price: values.unit_price,
      total: values.quantity * values.unit_price,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Item' : 'Adicionar Item'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Honorários mensais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Unitário *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border mt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total do Item</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatBRL(total)}
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
