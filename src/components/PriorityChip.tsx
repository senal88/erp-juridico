import { Badge } from '@/components/ui/badge'

const priorityMap: Record<string, { label: string; color: string }> = {
  low: {
    label: 'Baixa',
    color:
      'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
  },
  medium: { label: 'Média', color: 'bg-secondary/20 text-secondary hover:bg-secondary/30' },
  high: {
    label: 'Alta',
    color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300',
  },
}

export function PriorityChip({ priority }: { priority: string }) {
  const p = priorityMap[priority] || { label: priority, color: 'bg-slate-100 text-slate-800' }
  return (
    <Badge
      variant="outline"
      className={`${p.color} border-0 shadow-none font-medium whitespace-nowrap`}
    >
      {p.label}
    </Badge>
  )
}
