import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { getContractAmendments } from '@/services/contracts'
import { StatusChip } from '@/components/StatusChip'
import {
  Building2,
  HardHat,
  FileText,
  Pencil,
  Share2,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react'
import { format, differenceInDays, parseISO, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'

export function ContractSheet({ contract, open, onOpenChange }: any) {
  const [amendments, setAmendments] = useState<any[]>([])
  const [loadingAmendments, setLoadingAmendments] = useState(false)

  const loadAmendments = () => {
    if (contract) {
      setLoadingAmendments(true)
      getContractAmendments(contract.id)
        .then(setAmendments)
        .catch(console.error)
        .finally(() => setLoadingAmendments(false))
    }
  }

  useEffect(() => {
    if (open) loadAmendments()
  }, [open, contract])

  useRealtime('contract_amendments', () => {
    if (open) loadAmendments()
  })

  if (!contract) return null

  const getDerivedStatus = (c: any) => {
    const dateStr = c.vigencia_fim || c.expiry_date
    if (c.status !== 'active' || !dateStr) return c.status
    const days = differenceInDays(parseISO(dateStr), startOfDay(new Date()))
    if (days >= 0 && days <= 30) return 'expiring'
    return c.status
  }

  const derivedStatus = getDerivedStatus(contract)
  const expiryDateStr = contract.vigencia_fim || contract.expiry_date
  const expiryDateObj = expiryDateStr ? parseISO(expiryDateStr) : null

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[95vw] sm:max-w-5xl overflow-y-auto p-6">
        <SheetHeader className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusChip status={derivedStatus} />
                <span className="text-sm text-slate-500 font-medium tracking-wide uppercase">
                  Detalhes do Contrato
                </span>
              </div>
              <SheetTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                {contract.title}
              </SheetTitle>
              <SheetDescription className="text-base mt-1">
                Contrato #{contract.id.slice(0, 8).toUpperCase()}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" /> Compartilhar
              </Button>
              <Button className="bg-secondary text-white hover:bg-secondary/90 gap-2">
                <Pencil className="w-4 h-4" /> Editar
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 - Partes Envolvidas */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" />
              Partes Envolvidas
            </h3>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Cliente (Contratante)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {contract.expand?.client_id?.name || 'Cliente não informado'}
                </p>
                {contract.expand?.client_id?.cpf_cnpj && (
                  <p className="text-sm text-slate-500 mt-1">
                    CNPJ: {contract.expand?.client_id?.cpf_cnpj}
                  </p>
                )}
                {contract.expand?.client_id?.email && (
                  <p className="text-sm text-slate-500">{contract.expand?.client_id?.email}</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <HardHat className="w-4 h-4" /> Fornecedor (Contratado)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Escritório ERP Jurídico
                </p>
                <p className="text-sm text-slate-500 mt-1">CNPJ: 00.000.000/0001-00</p>
                <p className="text-sm text-slate-500">contato@erpjuri.com.br</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-secondary/5 border-secondary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-full">
                    <DollarSign className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Valor do Contrato</p>
                    <p className="text-lg font-bold text-slate-900">
                      {fmtCurrency(contract.value)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2 - Histórico de Aditivos */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Histórico de Aditivos
            </h3>
            <div className="space-y-4">
              {loadingAmendments ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))
              ) : amendments.length > 0 ? (
                amendments.map((a) => (
                  <Card key={a.id} className="shadow-sm overflow-hidden">
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-700" />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600">
                          {format(parseISO(a.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </span>
                        {a.value_change ? (
                          <span className="text-xs font-medium text-secondary">
                            {a.value_change > 0 ? '+' : ''}
                            {fmtCurrency(a.value_change)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {a.description}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center p-6 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm text-slate-500">Nenhum aditivo registrado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3 - Próximo Vencimento */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              Prazos e Vencimentos
            </h3>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-center space-y-2 mb-6">
                  <p className="text-sm font-medium text-slate-500">Próximo Vencimento</p>
                  {expiryDateObj ? (
                    <>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {format(expiryDateObj, 'dd/MM/yyyy')}
                      </p>
                      <p className="text-sm text-slate-500 capitalize">
                        {format(expiryDateObj, 'EEEE', { locale: ptBR })}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-medium text-slate-500">Não definido</p>
                  )}
                </div>

                {derivedStatus === 'expiring' && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800/30 text-center mb-6">
                    <p className="text-orange-800 dark:text-orange-400 font-medium text-sm">
                      Atenção: Contrato vencendo em{' '}
                      {differenceInDays(expiryDateObj!, startOfDay(new Date()))} dias.
                    </p>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Início da Vigência</span>
                    <span className="font-medium">
                      {contract.vigencia_inicio
                        ? format(parseISO(contract.vigencia_inicio), 'dd/MM/yyyy')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Fim da Vigência</span>
                    <span className="font-medium">
                      {contract.vigencia_fim
                        ? format(parseISO(contract.vigencia_fim), 'dd/MM/yyyy')
                        : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documents Section */}
        <div className="mt-10 pt-8 border-t">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Documentos Anexados
          </h3>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center bg-slate-50 dark:bg-slate-900/50">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum documento</p>
            <p className="text-sm text-slate-500 mt-1">
              Nenhum arquivo anexado a este contrato ainda.
            </p>
            <Button variant="outline" className="mt-4">
              Anexar Arquivo
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
