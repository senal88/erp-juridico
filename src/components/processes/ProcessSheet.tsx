import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Process, createProcess, updateProcess } from '@/services/processes'

const processSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  cnj: z.string().optional(),
  area: z.string().optional(),
  instance: z.string().optional(),
  vara: z.string().optional(),
  comarca: z.string().optional(),
  valor_causa: z.coerce.number().optional(),
  status: z.string().optional(),
  responsible_lawyer_id: z.string().optional(),
  summary: z.string().optional(),
})

type ProcessFormValues = z.infer<typeof processSchema>

interface ProcessSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  process?: Process | null
}

export function ProcessSheet({ open, onOpenChange, process }: ProcessSheetProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const form = useForm<any>({
    resolver: zodResolver(processSchema) as any,
    defaultValues: {
      title: '',
      client_id: '',
      cnj: '',
      area: 'civil',
      instance: 'primeira',
      vara: '',
      comarca: '',
      valor_causa: 0,
      status: 'novo',
      responsible_lawyer_id: '',
      summary: '',
    },
  })
  useEffect(() => {
    if (open) {
      pb.collection('clients').getFullList({ sort: 'name' }).then(setClients).catch(console.error)
      pb.collection('users').getFullList({ sort: 'name' }).then(setUsers).catch(console.error)

      if (process) {
        form.reset({
          title: process.title || '',
          client_id: process.client_id || '',
          cnj: process.cnj || '',
          area: process.area || '',
          instance: process.instance || '',
          vara: process.vara || '',
          comarca: process.comarca || '',
          valor_causa: process.valor_causa || 0,
          status: process.status || 'novo',
          responsible_lawyer_id: process.responsible_lawyer_id || '',
          summary: process.summary || '',
        })
      } else {
        form.reset({
          title: '',
          client_id: '',
          cnj: '',
          area: '',
          instance: '',
          vara: '',
          comarca: '',
          valor_causa: 0,
          status: 'novo',
          responsible_lawyer_id: '',
          summary: '',
        })
      }
    }
  }, [open, process, form])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (process) {
        await updateProcess(process.id, data as any)
        toast({ title: 'Processo atualizado com sucesso' })
      } else {
        await createProcess(data as any)
        toast({ title: 'Processo criado com sucesso' })
      }
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o processo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const onError = (errors: any) => {
    if (errors.title || errors.client_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o Título e o Cliente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col p-0">
        <div className="p-6 pb-4 border-b bg-slate-50">
          <SheetHeader>
            <SheetTitle className="font-serif text-2xl text-primary">
              {process ? 'Editar Processo' : 'Novo Processo'}
            </SheetTitle>
            <SheetDescription>
              Preencha os detalhes do processo abaixo para manter o controle no escritório.
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 p-6">
          <Form {...form}>
            <form
              id="process-form"
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Título <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ação Indenizatória contra X..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cliente <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
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
                  name="cnj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNJ</FormLabel>
                      <FormControl>
                        <Input placeholder="0000000-00.0000.0.00.0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="em_andamento">Em andamento</SelectItem>
                          <SelectItem value="audiencia_marcada">Audiência marcada</SelectItem>
                          <SelectItem value="com_sentenca">Com sentença</SelectItem>
                          <SelectItem value="em_recurso">Em recurso</SelectItem>
                          <SelectItem value="arquivado">Arquivado</SelectItem>
                          <SelectItem value="encerrado">Encerrado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vara"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vara</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1ª Vara Cível" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comarca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comarca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São Paulo / SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instância</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="primeira">Primeira</SelectItem>
                          <SelectItem value="segunda">Segunda</SelectItem>
                          <SelectItem value="superior">Superior</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_causa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Causa (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="responsible_lawyer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advogado Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um advogado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email}
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
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo / Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes adicionais do processo..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="process-form"
            disabled={loading}
            className="bg-gold-gradient shadow-gold-glow hover:opacity-90"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Processo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
