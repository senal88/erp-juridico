import { Lead, getLeadScoreColor, isLeadOverdue } from '@/services/leads'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

const ST_MAP: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificado: 'Qualificado',
  proposta: 'Proposta Enviada',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

interface Props {
  leads: Lead[]
  onEdit: (l: Lead) => void
  onStatusChange: (id: string, st: Lead['status']) => void
}

export function LeadKanban({ leads, onEdit, onStatusChange }: Props) {
  const handleDrop = (e: React.DragEvent, st: Lead['status']) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('leadId')
    if (id) onStatusChange(id, st)
  }

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {(Object.keys(ST_MAP) as Array<Lead['status']>).map((col) => {
        const colLeads = leads.filter((l) => l.status === col)
        const total = colLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0)
        return (
          <div
            key={col}
            className="min-w-[280px] w-[280px] snap-start bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-3 flex flex-col border border-border/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {ST_MAP[col]}
              </h3>
              <Badge variant="secondary" className="px-1.5">
                {colLeads.length}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground font-medium mb-3">{formatBRL(total)}</div>

            <div className="flex flex-col gap-2 flex-1 min-h-[150px]">
              {colLeads.map((l) => (
                <Card
                  key={l.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('leadId', l.id)}
                  onClick={() => onEdit(l)}
                  className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all bg-card"
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-sm truncate pr-2">{l.name}</p>
                      {l.score !== undefined && (
                        <Badge
                          className={`text-[10px] px-1 py-0 shadow-none border-0 ${getLeadScoreColor(l.score)}`}
                        >
                          {l.score}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2 truncate">
                      {l.company || l.source || '-'}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {l.estimated_value ? formatBRL(l.estimated_value) : '-'}
                      </span>
                      {isLeadOverdue(l) && (
                        <span title="Follow-up Atrasado">
                          <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
