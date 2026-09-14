import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, Plus, Edit, Trash2, History } from 'lucide-react'

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
  getProcessMovements,
  createProcessMovement,
  updateProcessMovement,
  deleteProcessMovement,
  type ProcessMovement,
  type ProcessMovementType,
} from '@/services/processes'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

const MOVEMENT_TYPES: Record<string, string> = {
  distribuicao: 'Distribuição',
  despacho: 'Despacho',
  decisao: 'Decisão',
  sentenca: 'Sentença',
  intimacao: 'Intimação',
  juntada: 'Juntada',
  peticao: 'Petição',
  audiencia: 'Audiência',
  recurso: 'Recurso',
  arquivamento: 'Arquivamento',
  outro: 'Outro',
}

export function MovementsTab({ processId }: { processId: string }) {
  const { toast } = useToast()
  const [movements, setMovements] = useState<ProcessMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<ProcessMovement | null>(null)

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'outro' as ProcessMovementType,
    description: '',
    is_critical: false,
  })

  const loadData = async () => {
    try {
      const data = await getProcessMovements(processId)
      setMovements(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [processId])

  useRealtime('process_movements', (e) => {
    if (e.record.process_id === processId) loadData()
  })

  const openDialog = (mov?: ProcessMovement) => {
    if (mov) {
      setEditingMovement(mov)
      setFormData({
        date: mov.date.substring(0, 10),
        type: mov.type || 'outro',
        description: mov.description,
        is_critical: mov.is_critical || false,
      })
    } else {
      setEditingMovement(null)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'outro',
        description: '',
        is_critical: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, process_id: processId }
      if (editingMovement) {
        await updateProcessMovement(editingMovement.id, payload)
        toast({ title: 'Andamento atualizado com sucesso.' })
      } else {
        await createProcessMovement({ ...payload, source: 'manual' })
        toast({ title: 'Andamento adicionado com sucesso.' })
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este andamento?')) return
    try {
      await deleteProcessMovement(id)
      toast({ title: 'Andamento excluído.' })
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
        <CardTitle className="text-lg">Linha do Tempo</CardTitle>
        <Button onClick={() => openDialog()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Novo Andamento
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {movements.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nenhum andamento"
            description="Nenhum andamento registrado para este processo."
          />
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pb-4">
            {movements.map((mov) => (
              <div key={mov.id} className="relative pl-6 group">
                <div
                  className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-slate-950 ${mov.is_critical ? 'bg-destructive' : 'bg-primary/50'}`}
                />
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                      {mov.type ? MOVEMENT_TYPES[mov.type] || mov.type : 'Andamento'}
                    </span>
                    {mov.is_critical && (
                      <Badge variant="destructive" className="gap-1 px-1.5 py-0">
                        <AlertCircle className="h-3 w-3" /> Crítico
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(parseISO(mov.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => openDialog(mov)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDelete(mov.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                  {mov.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMovement ? 'Editar Andamento' : 'Novo Andamento'}</DialogTitle>
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
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v as ProcessMovementType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOVEMENT_TYPES).map(([k, v]) => (
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
                className="min-h-[120px]"
                placeholder="Detalhes do andamento..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2 border border-slate-200 dark:border-slate-800 p-3 rounded-md">
              <Switch
                id="critical"
                checked={formData.is_critical}
                onCheckedChange={(c) => setFormData({ ...formData, is_critical: c })}
              />
              <Label htmlFor="critical" className="font-normal cursor-pointer">
                Marcar como andamento crítico (requer atenção)
              </Label>
            </div>
            <DialogFooter>
              <Button type="submit">{editingMovement ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
