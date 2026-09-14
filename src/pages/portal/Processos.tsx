import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Search, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import type { Process } from '@/services/processes'

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

export default function PortalProcessos() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await pb.collection('processes').getFullList<Process>({ sort: '-created' })
        setProcesses(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = processes.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) || (p.cnj && p.cnj.includes(search)),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Meus Processos</h2>
          <p className="text-muted-foreground mt-1">Acompanhe o andamento das suas ações legais.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou CNJ..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Scale className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">Nenhum processo encontrado</h3>
          <p className="text-slate-500 max-w-sm mt-1">
            {search
              ? 'Nenhum processo corresponde à sua busca.'
              : 'Você ainda não possui processos registrados em nosso sistema.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <Link to={`/portal/processos/${p.id}`} className="block">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row p-5 gap-4 items-start sm:items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center border">
                      <Scale className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{p.title}</h3>
                        {p.status && (
                          <Badge className={`${STATUS_VARIANTS[p.status]} shadow-none`}>
                            {STATUS_LABELS[p.status] || p.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        {p.cnj && <span className="font-medium text-slate-700">{p.cnj}</span>}
                        {p.area && (
                          <span className="capitalize text-slate-600 border-l pl-4 border-slate-200">
                            {p.area}
                          </span>
                        )}
                        {p.vara && <span className="border-l pl-4 border-slate-200">{p.vara}</span>}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 text-xs text-slate-400 sm:min-w-[120px]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Atualizado
                      </span>
                      <span>{format(parseISO(p.updated), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
