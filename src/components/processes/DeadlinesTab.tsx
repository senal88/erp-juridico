import { useState, useEffect } from 'react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { Plus, Clock, Edit, Trash2, CheckCircle2, Circle, CalendarDays } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'

import {
  getProcessDeadlines,
  createProcessDeadline,
  updateProcessDeadline,
  deleteProcessDeadline,
  type ProcessDeadline,
  type DeadlineType,
  type DeadlineStatus,
} from '@/services/processes'
import { businessDaysDiff } from '@/lib/business-days'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  cumprido: 'Cumprido',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
}

const TYPE_LABELS: Record<string, string> = {
  legal: 'Prazo Legal',
  interno: 'Prazo Interno',
}

export function DeadlinesTab({ processId }: { processId: string }) {
  const { toast } = useToast()
  const [deadlines, setDeadlines] = useState<ProcessDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<ProcessDeadline | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    type: 'legal' as DeadlineType,
    status: 'aberto' as DeadlineStatus,
    penalty_note: '',
  })

  const loadData = async () => {
    try {
      const data = await getProcessDeadlines(processId)
      setDeadlines(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [processId])

  useRealtime('process_deadlines', (e) => {
    if (e.record.process_id === processId) loadData()
  })

  const openDialog = (dl?: ProcessDeadline) => {
    if (dl) {
      setEditingDeadline(dl)
      setFormData({
        title: dl.title,
        description: dl.description || '',
        due_date: dl.due_date.substring(0, 10),
        type: dl.type || 'legal',
        status: dl.status || 'aberto',
        penalty_note: dl.penalty_note || '',
      })
    } else {
      setEditingDeadline(null)
      setFormData({
        title: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        type: 'legal',
        status: 'aberto',
        penalty_note: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, process_id: processId }
      if (editingDeadline) {
        await updateProcessDeadline(editingDeadline.id, payload)
        toast({ title: 'Prazo atualizado.' })
      } else {
        await createProcessDeadline(payload)
        toast({ title: 'Prazo registrado.' })
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este prazo?')) return
    try {
      await deleteProcessDeadline(id)
      toast({ title: 'Prazo excluído.' })
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const markAsDone = async (dl: ProcessDeadline) => {
    try {
      await updateProcessDeadline(dl.id, { status: 'cumprido' })
      toast({ title: 'Prazo marcado como cumprido.' })
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar prazo', description: err.message, variant: 'destructive' })
    }
  }

  const getUrgencyBadge = (dl: ProcessDeadline) => {
    if (dl.status === 'cumprido')
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none">
          Cumprido
        </Badge>
      )
    if (dl.status === 'cancelado')
      return (
        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 shadow-none">
          Cancelado
        </Badge>
      )

    const due = parseISO(dl.due_date)

    if (isPast(due) && !isToday(due)) {
      return (
        <Badge variant="destructive" className="shadow-none">
          Vencido
        </Badge>
      )
    }
    if (isToday(due)) {
      return (
        <Badge variant="destructive" className="shadow-none">
          Vence hoje
        </Badge>
      )
    }

    const days = businessDaysDiff(new Date(), due)
    if (days <= 3) {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:text-amber-500 dark:bg-amber-900/30 hover:bg-amber-100 shadow-none">
          Em {days} dias úteis
        </Badge>
      )
    }
    return (
      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 shadow-none">
        Em {days} dias úteis
      </Badge>
    )
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
        <CardTitle className="text-lg">Controle de Prazos</CardTitle>
        <Button onClick={() => openDialog()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Registrar Prazo
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {deadlines.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nenhum prazo"
            description="Não há prazos registrados para este processo."
          />
        ) : (
          <div className="space-y-3">
            {deadlines.map((dl) => {
              const isDone = dl.status === 'cumprido'
              return (
                <div
                  key={dl.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors group ${isDone ? 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  <button
                    onClick={() => !isDone && markAsDone(dl)}
                    disabled={isDone}
                    className={`mt-1 flex-shrink-0 transition-colors ${isDone ? 'text-emerald-500 cursor-default' : 'text-slate-300 hover:text-emerald-500'}`}
                    title={isDone ? 'Prazo já cumprido' : 'Marcar como cumprido'}
                  >
                    {isDone ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                  </button>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4
                            className={`font-semibold text-lg ${isDone ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}
                          >
                            {dl.title}
                          </h4>
                          {getUrgencyBadge(dl)}
                          <Badge variant="outline" className="text-xs uppercase font-semibold">
                            {TYPE_LABELS[dl.type] || dl.type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          <CalendarDays className="h-4 w-4" />
                          Vencimento:{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {format(parseISO(dl.due_date), 'dd/MM/yyyy')}
                          </span>
                        </div>

                        {dl.description && (
                          <p
                            className={`mt-2 text-sm ${isDone ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}
                          >
                            {dl.description}
                          </p>
                        )}

                        {dl.penalty_note && !isDone && (
                          <p className="mt-2 text-xs font-medium text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 inline-block">
                            Penalidade: {dl.penalty_note}
                          </p>
                        )}
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDialog(dl)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(dl.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeadline ? 'Editar Prazo' : 'Novo Prazo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Prazo</Label>
              <Input
                placeholder="Ex: Contestação"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as DeadlineType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes do que precisa ser feito..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {formData.type === 'legal' && (
              <div className="space-y-2">
                <Label className="text-amber-600 dark:text-amber-500">
                  Nota de Penalidade (Opcional)
                </Label>
                <Input
                  placeholder="Ex: Revelia em caso de perda"
                  className="border-amber-200 focus-visible:ring-amber-500 dark:border-amber-900/50"
                  value={formData.penalty_note}
                  onChange={(e) => setFormData({ ...formData, penalty_note: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as DeadlineStatus })}
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

            <DialogFooter>
              <Button type="submit">{editingDeadline ? 'Salvar' : 'Adicionar Prazo'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
