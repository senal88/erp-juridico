import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createServiceOrder, updateServiceOrder } from '@/services/service_orders'
import { getSchedules } from '@/services/os_schedules'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Plus, Calendar, User } from 'lucide-react'
import { StatusChip } from '@/components/StatusChip'
import { OsScheduleModal } from '@/components/OsScheduleModal'

export function OSModal({
  open,
  onOpenChange,
  osId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  osId?: string
  onSuccess?: () => void
}) {
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('open')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [schedules, setSchedules] = useState<any[]>([])
  const [schedModalOpen, setSchedModalOpen] = useState(false)

  useEffect(() => {
    if (open) {
      pb.collection('clients').getFullList().then(setClients)
      if (osId) {
        pb.collection('service_orders')
          .getOne(osId)
          .then((os) => {
            setTitle(os.title)
            setClientId(os.client_id)
            setPriority(os.priority)
            setStatus(os.status)
          })
        loadSchedules()
      } else {
        setTitle('')
        setClientId('')
        setPriority('medium')
        setStatus('open')
        setSchedules([])
      }
    }
  }, [open, osId])

  const loadSchedules = () => {
    if (osId) {
      getSchedules(`service_order_id='${osId}'`).then(setSchedules)
    }
  }

  const handleSubmit = async () => {
    if (!title || !clientId) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    try {
      const data = { title, client_id: clientId, priority, status }
      if (osId) {
        await updateServiceOrder(osId, data)
        toast({ title: 'Sucesso', description: 'Ordem de serviço atualizada.' })
      } else {
        await createServiceOrder({ ...data, checklist: [] })
        toast({ title: 'Sucesso', description: 'Ordem de serviço criada.' })
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const renderForm = () => (
    <>
      <div className="space-y-2">
        <Label>Título *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Manutenção Preventiva"
        />
      </div>
      <div className="space-y-2">
        <Label>Cliente *</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
            {clients.length === 0 && (
              <div className="p-2 text-sm text-slate-500">Nenhum cliente</div>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Em Aberto</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{osId ? 'Detalhes da OS' : 'Nova Ordem de Serviço'}</DialogTitle>
          {!osId && (
            <DialogDescription>Preencha os dados abaixo para criar uma nova OS.</DialogDescription>
          )}
        </DialogHeader>

        {osId ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="schedules">Agendamentos</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              {renderForm()}
            </TabsContent>
            <TabsContent value="schedules" className="space-y-4 min-h-[250px]">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Execuções Agendadas</h3>
                <Button size="sm" onClick={() => setSchedModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Novo
                </Button>
              </div>
              {schedules.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8 border border-dashed rounded-lg">
                  Nenhum agendamento encontrado.
                </div>
              ) : (
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 border rounded-lg flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium">
                            {format(parseISO(s.starts_at), 'dd/MM/yyyy HH:mm')}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <User className="w-3 h-3" />{' '}
                            {s.expand?.assigned_to?.name || s.expand?.assigned_to?.email}
                          </p>
                        </div>
                      </div>
                      <StatusChip tone="neutral" label={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4 py-4">{renderForm()}</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <OsScheduleModal
        open={schedModalOpen}
        onOpenChange={setSchedModalOpen}
        defaultOsId={osId}
        onSuccess={loadSchedules}
      />
    </Dialog>
  )
}
