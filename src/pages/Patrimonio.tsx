import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Plus,
  ShieldAlert,
  Download,
  RefreshCw,
  Landmark,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  PatrimonialAsset,
  getPatrimonialAssets,
  createPatrimonialAsset,
  updatePatrimonialAsset,
  deletePatrimonialAsset,
  toConsolidatedBRL,
  formatCurrencyVal,
} from '@/services/patrimonial_assets'
import { getClients } from '@/services/clients'
import { LedgerKpis } from '@/components/patrimonio/LedgerKpis'
import { DistributionPanel } from '@/components/patrimonio/DistributionPanel'
import { AssetTable } from '@/components/patrimonio/AssetTable'
import { AssetModal } from '@/components/patrimonio/AssetModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function PatrimonioPage() {
  const { toast } = useToast()
  const [assets, setAssets] = useState<PatrimonialAsset[]>([])
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<PatrimonialAsset | null>(null)
  const [assetToDelete, setAssetToDelete] = useState<PatrimonialAsset | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [assetsData, clientsData] = await Promise.all([getPatrimonialAssets(), getClients()])
      setAssets(assetsData)
      setClients(clientsData.map((c: any) => ({ id: c.id, name: c.name })))
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao carregar dados patrimoniais',
        description: err.message || 'Verifique a conexão.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenCreate = () => {
    setSelectedAsset(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (asset: PatrimonialAsset) => {
    setSelectedAsset(asset)
    setModalOpen(true)
  }

  const handleSaveAsset = async (data: any) => {
    if (selectedAsset) {
      await updatePatrimonialAsset(selectedAsset.id, data)
      toast({
        title: 'Ativo atualizado',
        description: `Os dados de "${data.name}" foram salvos no Ledger.`,
      })
    } else {
      await createPatrimonialAsset(data)
      toast({
        title: 'Ativo cadastrado',
        description: `"${data.name}" foi registrado na base SSOT.`,
      })
    }
    loadData()
  }

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return
    setDeleteLoading(true)
    try {
      await deletePatrimonialAsset(assetToDelete.id)
      toast({
        title: 'Registro removido',
        description: `"${assetToDelete.name}" foi excluído com sucesso.`,
      })
      setAssetToDelete(null)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Ativos abaixo de E2 (alerta de governança MFO)
  const unverifiedAssets = assets.filter(
    (a) => a.evidence_level === 'E0' || a.evidence_level === 'E1',
  )
  const unverifiedSumBRL = unverifiedAssets.reduce(
    (acc, a) => acc + toConsolidatedBRL(a.valuation_value, a.currency),
    0,
  )

  const handleExportCSV = () => {
    if (assets.length === 0) return
    const headers = [
      'Nome',
      'Tipo',
      'Classe',
      'Valuation Original',
      'Moeda',
      'Valuation Consolidado (BRL)',
      'Data Avaliacao',
      'Titular',
      'Estrutura',
      'Jurisdicao',
      'Pais',
      'Evidencia',
      'Valido Decisao Material',
      'Onus',
      'Liquidez',
    ]
    const rows = assets.map((a) => [
      `"${a.name.replace(/"/g, '""')}"`,
      a.asset_type,
      a.asset_class,
      a.valuation_value,
      a.currency,
      toConsolidatedBRL(a.valuation_value, a.currency).toFixed(2),
      a.valuation_date ? a.valuation_date.split('T')[0] : '',
      `"${(a.direct_owner || '').replace(/"/g, '""')}"`,
      a.holding_structure,
      a.jurisdiction_type,
      `"${(a.country || '').replace(/"/g, '""')}"`,
      a.evidence_level,
      a.evidence_level === 'E2' || a.evidence_level === 'E3' || a.evidence_level === 'E4'
        ? 'SIM'
        : 'NAO',
      `"${(a.encumbrances || '').replace(/"/g, '""')}"`,
      a.liquidity,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `patrimonial_ledger_ssot_${new Date().toISOString().split('T')[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Patrimonial Ledger & Governança SSOT"
        description="Base consolidada Single Source of Truth do Family Office com matriz de evidência probatória (E0 a E4)."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={assets.length === 0}
              className="text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="text-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Ativo / Passivo
            </Button>
          </div>
        }
      />

      {/* Alerta de Governança MFO: Se existirem ativos abaixo de E2 */}
      {unverifiedAssets.length > 0 && (
        <Alert className="border-amber-300 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="font-semibold text-sm">
              Alerta de Governança MFO: Evidência Probatória Insuficiente ({unverifiedAssets.length}{' '}
              posições)
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              Existem <strong>{unverifiedAssets.length} ativo(s)</strong> totalizando
              aproximadamente <strong>{formatCurrencyVal(unverifiedSumBRL, 'BRL')}</strong>{' '}
              classificados em níveis <strong>E0 ou E1</strong> (declarados sem prova ou
              preliminares). De acordo com o Manual Integrado MFO 2026,{' '}
              <em>
                recomendações materiais, reorganizações sucessórias e cálculos de legítima são
                expressamente vedados
              </em>{' '}
              até que a evidência documental seja qualificada para no mínimo <strong>E2</strong>.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Cartões KPIs Consolidados */}
      <LedgerKpis assets={assets} />

      {/* Gráficos de Distribuição por Classe, Jurisdição e Nível de Evidência */}
      <DistributionPanel assets={assets} />

      {/* Tabela Interativa de Ativos & Passivos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-5 h-5 text-secondary" />
            Inventário Detalhado do Ledger
          </h2>
          <span className="text-xs text-muted-foreground">
            {assets.length} registros cadastrados
          </span>
        </div>

        <AssetTable assets={assets} onEdit={handleOpenEdit} onDelete={(a) => setAssetToDelete(a)} />
      </div>

      {/* Modal de Criação / Edição */}
      <AssetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        asset={selectedAsset}
        clients={clients}
        onSave={handleSaveAsset}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Confirmar Exclusão de Registro SSOT
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover o registro de <strong>"{assetToDelete?.name}"</strong>.
              Esta operação alterará os saldos consolidados do Family Office. Deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAsset}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteLoading ? 'Excluindo...' : 'Sim, Excluir Ativo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
