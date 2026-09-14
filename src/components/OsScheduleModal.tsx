import { useState, useEffect } from 'react'
import { format, addHours, parseISO } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { getServiceOrders } from '@/services/service_orders'
import { getUsers } from '@/services/users'
import { getSchedule, createSchedule, updateSchedule } from '@/services/os_schedules'
import { useToast } from '@/hooks/use-toast'

export function OsScheduleModal({
  open,
  onOpenChange,
  scheduleId,
  defaultDate,
  defaultOsId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  scheduleId?: string
  defaultDate?: Date
  defaultOsId?: string
  onSuccess?: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  const [osId, setOsId] = useState(defaultOsId || '')
  const [assignedTo, setAssignedTo] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      getUsers().then(setUsers)
      getServiceOrders().then(setOrders)

      if (scheduleId) {
        setInitLoading(true)
        getSchedule(scheduleId).then((s) => {
          setOsId(s.service_order_id)
          setAssignedTo(s.assigned_to)
          setStartsAt(format(parseISO(s.starts_at), "yyyy-MM-dd'T'HH:mm"))
          setEndsAt(s.ends_at ? format(parseISO(s.ends_at), "yyyy-MM-dd'T'HH:mm") : '')
          setLocation(s.location || '')
          setStatus(s.status)
          setNotes(s.notes || '')
          setInitLoading(false)
        })
      } else {
        setOsId(defaultOsId || '')
        setAssignedTo('')
        const st = defaultDate || new Date()
        setStartsAt(format(st, "yyyy-MM-dd'T'HH:mm"))
        setEndsAt(format(addHours(st, 2), "yyyy-MM-dd'T'HH:mm"))
        setLocation('')
        setStatus('scheduled')
        setNotes('')
      }
    }
  }, [open, scheduleId, defaultDate, defaultOsId])

  const handleSubmit = async () => {
    if (!osId || !assignedTo || !startsAt || !status) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    const data = {
      service_order_id: osId,
      assigned_to: assignedTo,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : '',
      location,
      status,
      notes,
    }
    try {
      if (scheduleId) {
        await updateSchedule(scheduleId, data)
        toast({ title: 'Sucesso', description: 'Agendamento atualizado.' })
      } else {
        await createSchedule(data)
        toast({ title: 'Sucesso', description: 'Agendamento criado.' })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scheduleId ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        </DialogHeader>
        {initLoading ? (
          <div className="p-4 text-center text-slate-500">Carregando...</div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ordem de Serviço *</Label>
              <Select value={osId} onValueChange={setOsId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Técnico Responsável *</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início *</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Endereço ou local..."
              />
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
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
    </Dialog>
  )
}
