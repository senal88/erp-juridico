import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkActionsBarProps {
  selectedCount: number
  onClear: () => void
  isProcessing?: boolean
  children: React.ReactNode
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  isProcessing,
  children,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white shadow-2xl rounded-full px-4 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center gap-3 border-r border-slate-700 pr-4">
        <span className="bg-primary text-primary-foreground text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
          {selectedCount}
        </span>
        <span className="text-sm font-medium whitespace-nowrap">selecionados</span>
      </div>

      <div className="flex items-center gap-2">
        {isProcessing ? (
          <div className="flex items-center gap-2 px-4 text-slate-300 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </div>
        ) : (
          children
        )}
      </div>

      <div className="border-l border-slate-700 pl-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isProcessing}
          className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
