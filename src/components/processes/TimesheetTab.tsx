import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Timer, Clock, Coins, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TimeEntrySheet } from '@/components/TimeEntrySheet'
import { useToast } from '@/hooks/use-toast'
import { getTimeEntriesByProcess, deleteTimeEntry, type TimeEntry } from '@/services/time_entries'
import {
  formatMinutes,
  calculateBillableAmount,
  sumMinutes,
  sumBillableAmount,
} from '@/lib/time_utils'

const TIME_CATEGORIES: Record<string, { label: string; color: string }> = {
  drafting: { label: 'Redação', color: 'bg-blue-100 text-blue-800' },
  hearing: { label: 'Audiência', color: 'bg-purple-100 text-purple-800' },
  meeting: { label: 'Reunião', color: 'bg-indigo-100 text-indigo-800' },
  research: { label: 'Pesquisa', color: 'bg-teal-100 text-teal-800' },
  phone: { label: 'Ligação', color: 'bg-amber-100 text-amber-800' },
  email: { label: 'E-mail', color: 'bg-slate-100 text-slate-800' },
  other: { label: 'Outro', color: 'bg-gray-100 text-gray-800' },
}

const TIME_STATUSES: Record<string, { label: string; color: string }> = {
  registrada: { label: 'Registrada', color: 'bg-slate-100 text-slate-800' },
  cobrada: { label: 'Cobrada', color: 'bg-green-100 text-green-800' },
  descartada: { label: 'Descartada', color: 'bg-red-100 text-red-800' },
}

export function TimesheetTab({ processId }: { processId: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const { toast } = useToast()

  const loadEntries = async () => {
    setLoading(true)
    try {
      const data = await getTimeEntriesByProcess(processId)
      setEntries(data)
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Erro ao carregar horas.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [processId])

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de horas?')) return
    try {
      await deleteTimeEntry(id)
      toast({ title: 'Sucesso', description: 'Registro excluído.' })
      loadEntries()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const openNewEntry = () => {
    setEditingEntry(null)
    setSheetOpen(true)
  }

  const openEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setSheetOpen(true)
  }

  const totalMinutes = sumMinutes(entries)
  const totalBillable = sumBillableAmount(entries)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Horas trabalhadas
          </h2>
          <p className="text-sm text-muted-foreground">
            Registros de horas vinculados a este processo
          </p>
        </div>
        <Button onClick={openNewEntry} className="gap-2">
          <Plus className="w-4 h-4" /> Registrar horas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase">Total de horas</p>
              <p className="text-2xl font-bold text-slate-900">{formatMinutes(totalMinutes)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase">
                Valor cobrável acumulado
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalBillable,
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-slate-700">Sem registros de horas</p>
          <p className="text-sm mt-1">Nenhuma hora foi registrada para este processo ainda.</p>
          <Button onClick={openNewEntry} variant="outline" className="mt-6 gap-2">
            <Plus className="w-4 h-4" /> Registrar primeira atividade
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const cat = TIME_CATEGORIES[entry.category || 'other'] || TIME_CATEGORIES['other']
            const stat = TIME_STATUSES[entry.status || 'registrada'] || TIME_STATUSES['registrada']
            const billableVal = entry.is_billable
              ? calculateBillableAmount(entry.duration_minutes, entry.hourly_rate || 0)
              : 0

            return (
              <Card key={entry.id} className="shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={`border-transparent ${cat.color}`}>
                          {cat.label}
                        </Badge>
                        <Badge variant="secondary" className={`border-transparent ${stat.color}`}>
                          {stat.label}
                        </Badge>
                        {entry.is_billable && (
                          <Badge variant="outline" className="border-green-200 text-green-700">
                            Cobrável
                          </Badge>
                        )}
                      </div>

                      <p className="font-medium text-slate-900 whitespace-pre-wrap">
                        {entry.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{formatMinutes(entry.duration_minutes)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Timer className="w-4 h-4" />
                          <span>
                            {entry.date
                              ? format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </span>
                        </div>
                        {entry.expand?.user && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="font-medium">{entry.expand.user.name}</span>
                          </div>
                        )}
                        {entry.is_billable && billableVal > 0 && (
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(billableVal)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditEntry(entry)}>
                        <Edit className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <TimeEntrySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entry={editingEntry}
        onSave={loadEntries}
        presetProcessId={processId}
      />
    </div>
  )
}
