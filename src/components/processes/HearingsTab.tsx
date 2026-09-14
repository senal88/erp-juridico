import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Scale, Edit, Trash2, MapPin, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'

import {
  getProcessHearings,
  createProcessHearing,
  updateProcessHearing,
  deleteProcessHearing,
  type ProcessHearing,
  type ProcessHearingType,
  type ProcessHearingStatus,
} from '@/services/processes'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

const HEARING_TYPES: Record<string, string> = {
  instrucao: 'Instrução',
  conciliacao: 'Conciliação',
  mediacao: 'Mediação',
  julgamento: 'Julgamento',
  depoimento_pessoal: 'Depoimento Pessoal',
  oitiva_testemunhas: 'Oitiva de Testemunhas',
  outra: 'Outra',
}

const STATUS_VARIANTS: Record<string, string> = {
  agendada: 'bg-primary/10 text-primary',
  realizada: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-slate-100 text-slate-800',
  adiada: 'bg-amber-100 text-amber-800',
}

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  adiada: 'Adiada',
}

export function HearingsTab({ processId }: { processId: string }) {
  const { toast } = useToast()
  const [hearings, setHearings] = useState<ProcessHearing[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHearing, setEditingHearing] = useState<ProcessHearing | null>(null)

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: 'instrucao' as ProcessHearingType,
    status: 'agendada' as ProcessHearingStatus,
    vara: '',
    judge: '',
    mandatory: false,
    notes: '',
  })

  const loadData = async () => {
    try {
      const data = await getProcessHearings(processId)
      setHearings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [processId])

  useRealtime('process_hearings', (e) => {
    if (e.record.process_id === processId) loadData()
  })

  const openDialog = (h?: ProcessHearing) => {
    if (h) {
      setEditingHearing(h)
      setFormData({
        date: h.date.substring(0, 10),
        time: h.time || '',
        type: h.type || 'instrucao',
        status: h.status || 'agendada',
        vara: h.vara || '',
        judge: h.judge || '',
        mandatory: h.mandatory || false,
        notes: h.notes || '',
      })
    } else {
      setEditingHearing(null)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        type: 'instrucao',
        status: 'agendada',
        vara: '',
        judge: '',
        mandatory: false,
        notes: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, process_id: processId }
      if (editingHearing) {
        await updateProcessHearing(editingHearing.id, payload)
        toast({ title: 'Audiência atualizada.' })
      } else {
        await createProcessHearing(payload)
        toast({ title: 'Audiência agendada.' })
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta audiência?')) return
    try {
      await deleteProcessHearing(id)
      toast({ title: 'Audiência excluída.' })
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
      </div>
    )

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 dark:bg-slate-900/50">
        <CardTitle className="text-lg">Audiências</CardTitle>
        <Button onClick={() => openDialog()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Agendar Audiência
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {hearings.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Nenhuma audiência"
            description="Nenhuma audiência agendada para este processo."
          />
        ) : (
          <div className="space-y-4">
            {hearings.map((h) => {
              const d = parseISO(h.date)
              return (
                <div
                  key={h.id}
                  className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group"
                >
                  <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg w-16 h-16 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {format(d, 'MMM', { locale: ptBR })}
                    </span>
                    <span className="text-2xl font-bold text-primary">{format(d, 'dd')}</span>
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-slate-900 dark:text-white capitalize text-lg">
                            {h.type ? HEARING_TYPES[h.type] || h.type : 'Audiência'}
                          </h4>
                          <Badge
                            className={`${h.status ? STATUS_VARIANTS[h.status] : STATUS_VARIANTS['agendada']} shadow-none font-medium`}
                          >
                            {h.status ? STATUS_LABELS[h.status] : 'Agendada'}
                          </Badge>
                          {h.mandatory && (
                            <Badge variant="destructive" className="shadow-none">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {h.time || 'A definir'}
                          </div>
                          {h.vara && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" /> {h.vara}
                            </div>
                          )}
                          {h.judge && (
                            <div className="flex items-center gap-1.5">
                              <Scale className="h-4 w-4" /> {h.judge}
                            </div>
                          )}
                        </div>
                        {h.notes && (
                          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                            {h.notes}
                          </p>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(h)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(h.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingHearing ? 'Editar Audiência' : 'Nova Audiência'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Audiência</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as ProcessHearingType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HEARING_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as ProcessHearingStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vara / Local</Label>
                <Input
                  placeholder="Ex: 2ª Vara Cível"
                  value={formData.vara}
                  onChange={(e) => setFormData({ ...formData, vara: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Juiz(a)</Label>
                <Input
                  placeholder="Nome do Magistrado"
                  value={formData.judge}
                  onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 border border-slate-200 dark:border-slate-800 p-3 rounded-md">
              <Switch
                id="mandatory"
                checked={formData.mandatory}
                onCheckedChange={(c) => setFormData({ ...formData, mandatory: c })}
              />
              <Label htmlFor="mandatory" className="font-normal cursor-pointer">
                Comparecimento obrigatório do cliente
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Instruções adicionais, link para videoconferência..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="submit">{editingHearing ? 'Salvar' : 'Agendar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
