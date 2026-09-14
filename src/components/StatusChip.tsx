import { Badge } from '@/components/ui/badge'

const statusMap: Record<string, { label: string; color: string }> = {
  open: {
    label: 'Em Aberto',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  completed: {
    label: 'Concluída',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
}

export function StatusChip({ status }: { status: string }) {
  const s = statusMap[status] || {
    label: status,
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  }
  return (
    <Badge
      className={`${s.color} border-0 shadow-none font-semibold px-2.5 py-0.5 whitespace-nowrap`}
    >
      {s.label}
    </Badge>
  )
}
