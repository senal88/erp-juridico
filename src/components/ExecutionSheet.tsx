import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { updateServiceOrder } from '@/services/service_orders'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, PenTool } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { StatusChip } from '@/components/StatusChip'

export function ExecutionSheet({
  order,
  open,
  onOpenChange,
  onUpdate,
}: {
  order: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}) {
  const [checklist, setChecklist] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (order && open) {
      setChecklist(order.checklist ? [...order.checklist] : [])
    }
  }, [order, open])

  const toggleChecklist = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].done = !newChecklist[index].done
    setChecklist(newChecklist)
  }

  const handleConcluir = async () => {
    setLoading(true)
    try {
      await updateServiceOrder(order.id, { status: 'completed', checklist })
      toast({
        title: 'OS Concluída',
        description: 'A ordem de serviço foi atualizada com sucesso.',
      })
      onUpdate?.()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSalvarAndamento = async () => {
    setLoading(true)
    try {
      await updateServiceOrder(order.id, {
        checklist,
        status: order.status === 'open' ? 'in_progress' : order.status,
      })
      toast({ title: 'Progresso Salvo', description: 'O checklist foi atualizado.' })
      onUpdate?.()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!order) return null

  const isCompleted = order.status === 'completed'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full border-l overflow-hidden">
        <SheetHeader className="p-4 border-b shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col text-left flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{order.title}</SheetTitle>
              <SheetDescription className="text-sm truncate">
                {order.expand?.client_id?.name || 'Cliente não informado'}
              </SheetDescription>
            </div>
            <div className="shrink-0 hidden sm:block">
              <StatusChip status={order.status} />
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">
            <div className="sm:hidden mb-2">
              <StatusChip status={order.status} />
            </div>

            {order.description && (
              <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                {order.description}
              </div>
            )}

            {/* Checklist Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Checklist de Execução</span>
                <span className="text-xs font-normal text-slate-500 normal-case bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {checklist.filter((i: any) => i.done).length}/{checklist.length} concluídos
                </span>
              </h3>
              {checklist && checklist.length > 0 ? (
                <div className="space-y-2">
                  {checklist.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start space-x-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <Checkbox
                        id={`check-${i}`}
                        checked={item.done}
                        onCheckedChange={() => toggleChecklist(i)}
                        disabled={isCompleted}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`check-${i}`}
                        className={`text-sm leading-tight cursor-pointer flex-1 ${item.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        {item.text}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 p-6 border border-dashed rounded-lg text-center bg-slate-50/50 dark:bg-slate-800/50">
                  Nenhum item no checklist para esta OS.
                </div>
              )}
            </div>

            <Separator />

            {/* Evidências Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Evidências (Fotos)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {!isCompleted && (
                  <div className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-all cursor-pointer bg-white dark:bg-slate-900 shadow-sm">
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Adicionar Foto</span>
                  </div>
                )}
                {/* Placeholder thumbnails */}
                <div className="aspect-square rounded-xl bg-slate-200 overflow-hidden relative shadow-sm border dark:border-slate-800">
                  <img
                    src="https://img.usecurling.com/p/200/200?q=maintenance&seed=1"
                    className="object-cover w-full h-full"
                    alt="Evidência"
                  />
                </div>
                <div className="aspect-square rounded-xl bg-slate-200 overflow-hidden relative shadow-sm border dark:border-slate-800">
                  <img
                    src="https://img.usecurling.com/p/200/200?q=equipment&seed=2"
                    className="object-cover w-full h-full"
                    alt="Evidência"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                As fotos são adicionadas apenas visualmente nesta versão.
              </p>
            </div>

            <Separator />

            {/* Assinatura Section */}
            <div className="space-y-3 pb-8">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Assinatura do Cliente
              </h3>
              <div className="h-32 rounded-xl border bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 relative shadow-sm overflow-hidden group">
                <PenTool className="h-8 w-8 mb-2 opacity-20 group-hover:opacity-40 transition-opacity" />
                <span className="text-sm font-medium">Área para assinatura digital</span>
                {!isCompleted && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-3 right-3 text-xs shadow-sm"
                  >
                    Coletar Assinatura
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white dark:bg-slate-900 shrink-0 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
          {!isCompleted && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSalvarAndamento}
              disabled={loading}
            >
              Salvar Andamento
            </Button>
          )}
          <Button
            className={isCompleted ? 'w-full' : 'flex-1'}
            onClick={isCompleted ? () => onOpenChange(false) : handleConcluir}
            disabled={loading && !isCompleted}
            variant={isCompleted ? 'secondary' : 'default'}
          >
            {loading ? 'Processando...' : isCompleted ? 'Fechar' : 'Concluir OS'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
