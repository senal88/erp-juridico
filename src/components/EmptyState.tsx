import { FileQuestion } from 'lucide-react'

export interface EmptyStateProps {
  message?: string
  title?: string
  description?: string
  icon?: any
}

export function EmptyState({
  message = 'Nenhum registro encontrado.',
  title,
  description,
  icon: Icon,
}: EmptyStateProps) {
  const FallbackIcon = Icon || FileQuestion
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <FallbackIcon className="h-12 w-12 mb-4 text-slate-300" />
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      )}
      <p>{description || message}</p>
    </div>
  )
}
