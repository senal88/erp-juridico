import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { getProcess, type Process } from '@/services/processes'
import { ProcessSheet } from '@/components/processes/ProcessSheet'
import { useRealtime } from '@/hooks/use-realtime'
import { STATUS_LABELS, STATUS_VARIANT, AREA_LABELS } from '@/lib/process-labels'
import { PartiesTab } from '@/components/processes/PartiesTab'
import { DocumentsTab } from '@/components/processes/DocumentsTab'
import { MovementsTab } from '@/components/processes/MovementsTab'
import { HearingsTab } from '@/components/processes/HearingsTab'
import { DeadlinesTab } from '@/components/processes/DeadlinesTab'
import { TimesheetTab } from '@/components/processes/TimesheetTab'

export default function ProcessoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [process, setProcess] = useState<Process | null>(null)
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const loadData = async () => {
    if (!id) return
    try {
      const data = await getProcess(id)
      setProcess(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('processes', (e) => {
    if (e.record.id === id) {
      loadData()
    }
  })

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!process)
    return <div className="p-12 text-center text-muted-foreground">Processo não encontrado.</div>

  const statusVariant = process.status ? STATUS_VARIANT[process.status] : STATUS_VARIANT['novo']
  const statusLabel = process.status ? STATUS_LABELS[process.status] : 'Novo'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/processos')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar aos processos
        </Button>
        <Button onClick={() => setSheetOpen(true)} variant="outline" className="gap-2">
          <Edit className="h-4 w-4" /> Editar Processo
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                {process.title}
              </CardTitle>
              {process.cnj && (
                <p className="text-sm font-mono text-muted-foreground mt-2 bg-slate-100 inline-block px-2 py-1 rounded">
                  {process.cnj}
                </p>
              )}
            </div>
            <Badge
              className={`px-3 py-1 shadow-none font-medium hover:opacity-80 ${statusVariant}`}
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="mb-4 overflow-x-auto flex-nowrap justify-start max-w-full">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="partes">Partes</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="andamentos">Andamentos</TabsTrigger>
          <TabsTrigger value="audiencias">Audiências</TabsTrigger>
          <TabsTrigger value="prazos">Prazos</TabsTrigger>
          <TabsTrigger value="horas">Horas</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6 mt-0">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Cliente
                  </p>
                  <p className="font-medium mt-1 text-slate-900">
                    {process.expand?.client_id?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Área
                  </p>
                  <p className="font-medium mt-1 text-slate-900 capitalize">
                    {process.area ? AREA_LABELS[process.area] || process.area : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Responsável
                  </p>
                  <p className="font-medium mt-1 text-slate-900">
                    {process.expand?.responsible_lawyer_id?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Criado em
                  </p>
                  <p className="font-medium mt-1 text-slate-900">
                    {format(new Date(process.created), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                {process.vara && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Vara
                    </p>
                    <p className="font-medium mt-1 text-slate-900">{process.vara}</p>
                  </div>
                )}
                {process.comarca && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Comarca
                    </p>
                    <p className="font-medium mt-1 text-slate-900">{process.comarca}</p>
                  </div>
                )}
                {process.instance && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Instância
                    </p>
                    <p className="font-medium mt-1 text-slate-900 capitalize">{process.instance}</p>
                  </div>
                )}
                {process.valor_causa !== undefined && process.valor_causa > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Valor da Causa
                    </p>
                    <p className="font-medium mt-1 text-slate-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(process.valor_causa)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Resumo e Observações</CardTitle>
            </CardHeader>
            <CardContent>
              {process.summary ? (
                <div
                  className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100"
                  dangerouslySetInnerHTML={{ __html: process.summary }}
                />
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 text-slate-500 shadow-sm">
                  Nenhuma observação registrada para este processo.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partes" className="mt-0">
          <PartiesTab processId={id!} />
        </TabsContent>

        <TabsContent value="documentos" className="mt-0">
          <DocumentsTab processId={id!} />
        </TabsContent>

        <TabsContent value="andamentos" className="mt-0">
          <MovementsTab processId={id!} />
        </TabsContent>

        <TabsContent value="audiencias" className="mt-0">
          <HearingsTab processId={id!} />
        </TabsContent>

        <TabsContent value="prazos" className="mt-0">
          <DeadlinesTab processId={id!} />
        </TabsContent>

        <TabsContent value="horas" className="mt-0">
          <TimesheetTab processId={id!} />
        </TabsContent>
      </Tabs>

      <ProcessSheet open={sheetOpen} onOpenChange={setSheetOpen} process={process} />
    </div>
  )
}
