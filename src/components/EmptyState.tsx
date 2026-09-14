import { FileQuestion } from 'lucide-react'

export function EmptyState({ message = 'Nenhum registro encontrado.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <FileQuestion className="h-12 w-12 mb-4 text-slate-300" />
      <p>{message}</p>
    </div>
  )
}
