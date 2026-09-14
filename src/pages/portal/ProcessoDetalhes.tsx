import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Scale, Clock, CalendarDays, FileText, History, Download } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { businessDaysDiff } from '@/lib/business-days'

import type {
  Process,
  ProcessMovement,
  ProcessHearing,
  ProcessDeadline,
  ProcessDocument,
} from '@/services/processes'

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  em_andamento: 'Em Andamento',
  audiencia_marcada: 'Audiência Marcada',
  com_sentenca: 'Com Sentença',
  em_recurso: 'Em Recurso',
  arquivado: 'Arquivado',
  encerrado: 'Encerrado',
}

const STATUS_VARIANTS: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  em_andamento: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
  audiencia_marcada: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  com_sentenca: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  em_recurso: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  arquivado: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
  encerrado: 'bg-slate-200 text-slate-800 hover:bg-slate-200',
}

export default function PortalProcessoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const [process, setProcess] = useState<Process | null>(null)
  const [movements, setMovements] = useState<ProcessMovement[]>([])
  const [hearings, setHearings] = useState<ProcessHearing[]>([])
  const [deadlines, setDeadlines] = useState<ProcessDeadline[]>([])
  const [documents, setDocuments] = useState<ProcessDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const loadData = async () => {
      try {
        const [proc, movs, hears, deads, docs] = await Promise.all([
          pb.collection('processes').getOne<Process>(id),
          pb.collection('process_movements').getFullList<ProcessMovement>({
            filter: `process_id = "${id}"`,
            sort: '-date,-created',
          }),
          pb.collection('process_hearings').getFullList<ProcessHearing>({
            filter: `process_id = "${id}"`,
            sort: 'date,time',
          }),
          pb.collection('process_deadlines').getFullList<ProcessDeadline>({
            filter: `process_id = "${id}"`,
            sort: 'due_date',
          }),
          pb.collection('process_documents').getFullList<ProcessDocument>({
            filter: `process_id = "${id}"`,
            sort: '-created',
          }),
        ])
        setProcess(proc)
        setMovements(movs)
        setHearings(hears)
        setDeadlines(deads)
        setDocuments(docs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!process) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Scale className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold">Processo não encontrado</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/portal/processos">Voltar aos processos</Link>
        </Button>
      </div>
    )
  }

  const getUrgencyBadge = (dl: ProcessDeadline) => {
    if (dl.status === 'cumprido')
      return <Badge className="bg-emerald-100 text-emerald-800 shadow-none">Cumprido</Badge>
    if (dl.status === 'cancelado')
      return <Badge className="bg-slate-100 text-slate-800 shadow-none">Cancelado</Badge>

    const due = parseISO(dl.due_date)
    if (isPast(due) && !isToday(due))
      return (
        <Badge variant="destructive" className="shadow-none">
          Vencido
        </Badge>
      )
    if (isToday(due))
      return (
        <Badge variant="destructive" className="shadow-none">
          Vence hoje
        </Badge>
      )

    const days = businessDaysDiff(new Date(), due)
    if (days <= 3)
      return <Badge className="bg-amber-100 text-amber-800 shadow-none">Em {days} d.u.</Badge>
    return <Badge className="bg-primary/10 text-primary shadow-none">Em {days} d.u.</Badge>
  }

  return (
    <div className="space-y-6 pb-12">
      <Button asChild variant="ghost" className="mb-2 -ml-3">
        <Link to="/portal/processos">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{process.title}</h1>
              {process.status && (
                <Badge
                  className={`${STATUS_VARIANTS[process.status]} shadow-none text-sm px-3 py-0.5`}
                >
                  {STATUS_LABELS[process.status] || process.status}
                </Badge>
              )}
            </div>
            {process.cnj && (
              <p className="text-lg text-slate-600 font-medium">CNJ: {process.cnj}</p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden border-b rounded-none h-12 bg-transparent p-0">
          <TabsTrigger
            value="resumo"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
          >
            Resumo
          </TabsTrigger>
          <TabsTrigger
            value="andamentos"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
          >
            Andamentos ({movements.length})
          </TabsTrigger>
          <TabsTrigger
            value="audiencias"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
          >
            Audiências ({hearings.length})
          </TabsTrigger>
          <TabsTrigger
            value="prazos"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
          >
            Prazos ({deadlines.length})
          </TabsTrigger>
          <TabsTrigger
            value="documentos"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
          >
            Documentos ({documents.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="resumo" className="m-0 focus-visible:outline-none">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Área do Direito</h3>
                    <p className="text-base font-medium text-slate-900 capitalize">
                      {process.area || 'Não informada'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">
                      Vara / Órgão Julgador
                    </h3>
                    <p className="text-base font-medium text-slate-900">
                      {process.vara || 'Não informada'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Comarca</h3>
                    <p className="text-base font-medium text-slate-900">
                      {process.comarca || 'Não informada'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Valor da Causa</h3>
                    <p className="text-base font-medium text-slate-900">
                      {process.valor_causa
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(process.valor_causa)
                        : 'Não informado'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:row-span-2">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-4">Resumo do Processo</h3>
                  {process.summary ? (
                    <div
                      className="prose prose-sm max-w-none prose-slate"
                      dangerouslySetInnerHTML={{ __html: process.summary }}
                    />
                  ) : (
                    <p className="text-slate-500 italic">
                      Nenhum resumo registrado para este processo.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="andamentos" className="m-0 focus-visible:outline-none">
            <Card>
              <CardContent className="p-6">
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <History className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p>Nenhum andamento registrado.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                    {movements.map((mov) => (
                      <div key={mov.id} className="relative pl-6">
                        <div
                          className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white ${
                            mov.is_critical ? 'bg-destructive' : 'bg-primary/50'
                          }`}
                        />
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                            {mov.type || 'Andamento'}
                          </span>
                          {mov.is_critical && (
                            <Badge variant="destructive" className="px-1.5 py-0">
                              Crítico
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-2">
                            {format(parseISO(mov.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap">
                          {mov.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audiencias" className="m-0 focus-visible:outline-none">
            <div className="grid gap-4">
              {hearings.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-500">
                  <CalendarDays className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p>Nenhuma audiência agendada.</p>
                </div>
              ) : (
                hearings.map((h) => {
                  const d = parseISO(h.date)
                  return (
                    <Card key={h.id}>
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row items-start gap-4 p-5">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-50 rounded-lg w-16 h-16 border border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase">
                              {format(d, 'MMM', { locale: ptBR })}
                            </span>
                            <span className="text-2xl font-bold text-primary">
                              {format(d, 'dd')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-semibold text-slate-900 text-lg capitalize">
                                {h.type || 'Audiência'}
                              </h4>
                              <Badge
                                className={`${
                                  h.status === 'realizada'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : h.status === 'cancelada'
                                      ? 'bg-slate-100 text-slate-800'
                                      : h.status === 'adiada'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-primary/10 text-primary'
                                } shadow-none`}
                              >
                                {h.status || 'Agendada'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-slate-400" /> {h.time || 'A definir'}
                              </div>
                              {h.vara && (
                                <div className="flex items-center gap-1.5">
                                  <Scale className="h-4 w-4 text-slate-400" /> {h.vara}
                                </div>
                              )}
                            </div>
                            {h.notes && (
                              <p className="mt-3 text-sm text-slate-600 bg-amber-50/50 text-amber-900 p-3 rounded-md border border-amber-100">
                                {h.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="prazos" className="m-0 focus-visible:outline-none">
            <div className="grid gap-4">
              {deadlines.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-500">
                  <Clock className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p>Nenhum prazo registrado.</p>
                </div>
              ) : (
                deadlines.map((dl) => (
                  <Card
                    key={dl.id}
                    className={dl.status === 'cumprido' ? 'bg-slate-50 border-slate-200' : ''}
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4
                            className={`font-semibold text-lg ${
                              dl.status === 'cumprido'
                                ? 'text-slate-500 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {dl.title}
                          </h4>
                          {getUrgencyBadge(dl)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                          <CalendarDays className="h-4 w-4" /> Vencimento:{' '}
                          <strong className="text-slate-700">
                            {format(parseISO(dl.due_date), 'dd/MM/yyyy')}
                          </strong>
                        </div>
                        {dl.description && (
                          <p
                            className={`mt-2 text-sm ${
                              dl.status === 'cumprido' ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {dl.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="documentos" className="m-0 focus-visible:outline-none">
            <div className="grid gap-4 md:grid-cols-2">
              {documents.length === 0 ? (
                <div className="col-span-2 bg-white border rounded-xl p-12 text-center text-slate-500">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p>Nenhum documento disponível.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 flex justify-between items-start gap-4">
                      <div className="flex gap-3 min-w-0">
                        <div className="mt-1 h-10 w-10 bg-slate-100 text-slate-500 rounded flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <h4 className="font-semibold text-slate-900 leading-tight truncate">
                            {doc.title}
                          </h4>
                          {doc.kind && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase font-semibold"
                            >
                              {doc.kind.replace('_', ' ')}
                            </Badge>
                          )}
                          <div className="text-xs text-slate-500">
                            {format(new Date(doc.created), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        asChild
                        disabled={!doc.file}
                      >
                        <a
                          href={doc.file ? pb.files.getURL(doc as any, doc.file) : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="h-4 w-4 mr-2" /> Baixar
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
