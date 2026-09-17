import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, ShieldCheck, ShieldAlert, Info } from 'lucide-react'
import {
  PatrimonialAsset,
  AssetType,
  AssetClass,
  CurrencyCode,
  HoldingStructure,
  JurisdictionType,
  LiquidityLevel,
  EvidenceLevel,
  EVIDENCE_LEVELS,
  ASSET_CLASS_LABELS,
  HOLDING_STRUCTURE_LABELS,
} from '@/services/patrimonial_assets'

interface AssetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: PatrimonialAsset | null
  clients: Array<{ id: string; name: string }>
  onSave: (data: any) => Promise<void>
}

export function AssetModal({ open, onOpenChange, asset, clients, onSave }: AssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [assetType, setAssetType] = useState<AssetType>('asset')
  const [assetClass, setAssetClass] = useState<AssetClass>('corporate_stake')
  const [valuationValue, setValuationValue] = useState<string>('')
  const [valuationDate, setValuationDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [currency, setCurrency] = useState<CurrencyCode>('BRL')
  const [directOwner, setDirectOwner] = useState('')
  const [sharedOwnership, setSharedOwnership] = useState('')
  const [holdingStructure, setHoldingStructure] = useState<HoldingStructure>('holding_familiar')
  const [jurisdictionType, setJurisdictionType] = useState<JurisdictionType>('brasil')
  const [country, setCountry] = useState('Brasil')
  const [encumbrances, setEncumbrances] = useState('')
  const [liquidity, setLiquidity] = useState<LiquidityLevel>('media')
  const [evidenceLevel, setEvidenceLevel] = useState<EvidenceLevel>('E3')
  const [evidenceNotes, setEvidenceNotes] = useState('')
  const [notes, setNotes] = useState('')
  const [clientId, setClientId] = useState('')

  useEffect(() => {
    if (asset) {
      setName(asset.name || '')
      setDescription(asset.description || '')
      setAssetType(asset.asset_type || 'asset')
      setAssetClass(asset.asset_class || 'corporate_stake')
      setValuationValue(asset.valuation_value?.toString() || '0')
      setValuationDate(
        asset.valuation_date
          ? asset.valuation_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
      )
      setCurrency(asset.currency || 'BRL')
      setDirectOwner(asset.direct_owner || '')
      setSharedOwnership(asset.shared_ownership || '')
      setHoldingStructure(asset.holding_structure || 'holding_familiar')
      setJurisdictionType(asset.jurisdiction_type || 'brasil')
      setCountry(asset.country || 'Brasil')
      setEncumbrances(asset.encumbrances || '')
      setLiquidity(asset.liquidity || 'media')
      setEvidenceLevel(asset.evidence_level || 'E3')
      setEvidenceNotes(asset.evidence_notes || '')
      setNotes(asset.notes || '')
      setClientId(asset.client_id || '')
    } else {
      setName('')
      setDescription('')
      setAssetType('asset')
      setAssetClass('corporate_stake')
      setValuationValue('')
      setValuationDate(new Date().toISOString().split('T')[0])
      setCurrency('BRL')
      setDirectOwner('')
      setSharedOwnership('')
      setHoldingStructure('holding_familiar')
      setJurisdictionType('brasil')
      setCountry('Brasil')
      setEncumbrances('')
      setLiquidity('media')
      setEvidenceLevel('E3')
      setEvidenceNotes('')
      setNotes('')
      setClientId(clients[0]?.id || '')
    }
    setFormError(null)
  }, [asset, open, clients])

  const handleJurisdictionChange = (val: JurisdictionType) => {
    setJurisdictionType(val)
    if (val === 'brasil') {
      setCountry('Brasil')
      if (currency !== 'BRL') setCurrency('BRL')
    } else {
      if (country === 'Brasil') setCountry('Ilhas Virgens Britânicas (BVI)')
      if (currency === 'BRL') setCurrency('USD')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('O nome do ativo/passivo é obrigatório.')
      return
    }
    if (!directOwner.trim()) {
      setFormError('A titularidade direta é obrigatória.')
      return
    }
    if (!clientId) {
      setFormError('Selecione a família / cliente proprietário.')
      return
    }
    const numValue = parseFloat(valuationValue)
    if (isNaN(numValue) || numValue < 0) {
      setFormError('Insira um valor de avaliação válido (maior ou igual a zero).')
      return
    }

    // Regra de Governança MFO: E3/E4 exigem apontamento de notas/documentos comprobatórios
    if ((evidenceLevel === 'E3' || evidenceLevel === 'E4') && !evidenceNotes.trim()) {
      setFormError(
        'Governança MFO: Para níveis E3 ou E4, é mandatório preencher as Notas de Evidência com a referência documental (ex: nº de matrícula de imóvel, certidão da Junta, laudo pericial ou extrato de custódia).',
      )
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        asset_type: assetType,
        asset_class: assetClass,
        valuation_value: numValue,
        valuation_date: new Date(valuationDate).toISOString(),
        currency,
        direct_owner: directOwner.trim(),
        shared_ownership: sharedOwnership.trim(),
        holding_structure: holdingStructure,
        jurisdiction_type: jurisdictionType,
        country: country.trim(),
        encumbrances: encumbrances.trim(),
        liquidity,
        evidence_level: evidenceLevel,
        valid_for_material_decision:
          evidenceLevel === 'E2' || evidenceLevel === 'E3' || evidenceLevel === 'E4',
        evidence_notes: evidenceNotes.trim(),
        notes: notes.trim(),
        client_id: clientId,
      }

      await onSave(payload)
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Erro ao salvar o ativo patrimonial.')
    } finally {
      setLoading(false)
    }
  }

  const isBelowE2 = evidenceLevel === 'E0' || evidenceLevel === 'E1'
  const activeLevelConfig = EVIDENCE_LEVELS[evidenceLevel]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            {asset ? 'Editar Posição Patrimonial' : 'Novo Registro no Patrimonial Ledger'}
          </DialogTitle>
          <DialogDescription>
            Cadastro SSOT (Single Source of Truth) com classificação de evidência jurídica e
            financeira (E0 a E4).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {formError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Não foi possível salvar</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Banner explicativo do Nível de Evidência Selecionado */}
          <div
            className={`p-3.5 rounded-lg border text-sm flex items-start gap-3 transition-colors ${activeLevelConfig.colorClasses}`}
          >
            {isBelowE2 ? (
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <span>{activeLevelConfig.label}</span>
                {isBelowE2 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-normal">
                    Evidência Insuficiente para Decisão Material
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-700 text-white font-normal">
                    Válido para Recomendações e Planejamento
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90 leading-relaxed">{activeLevelConfig.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Família / Cliente */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="client_id">Família / Cliente Titular *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Selecione o cliente / família" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome / Denominação */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Nome / Denominação do Ativo ou Passivo *</Label>
              <Input
                id="name"
                placeholder="Ex: Holding Moradas do Sol S.A. ou Lajes Corporativas Faria Lima"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Descrição resumida */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Descrição Resumida & Função Patrimonial</Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="Ex: Veículo societário de controle acionário das subsidiárias agrícolas operacionais."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tipo: Ativo ou Passivo */}
            <div className="space-y-1.5">
              <Label htmlFor="asset_type">Natureza Contábil *</Label>
              <Select value={assetType} onValueChange={(v: AssetType) => setAssetType(v)}>
                <SelectTrigger id="asset_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Ativo (Bens e Direitos)</SelectItem>
                  <SelectItem value="liability">Passivo (Dívidas, CCBs, Financiamentos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Classe do Ativo */}
            <div className="space-y-1.5">
              <Label htmlFor="asset_class">Classe do Ativo / Passivo *</Label>
              <Select value={assetClass} onValueChange={(v: AssetClass) => setAssetClass(v)}>
                <SelectTrigger id="asset_class">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_CLASS_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valuation Value */}
            <div className="space-y-1.5">
              <Label htmlFor="valuation_value">Valor da Avaliação (Valuation) *</Label>
              <Input
                id="valuation_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={valuationValue}
                onChange={(e) => setValuationValue(e.target.value)}
                required
              />
            </div>

            {/* Moeda */}
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moeda Base *</Label>
              <Select value={currency} onValueChange={(v: CurrencyCode) => setCurrency(v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL (Real Brasileiro)</SelectItem>
                  <SelectItem value="USD">USD (Dólar Americano)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">GBP (Libra Esterlina)</SelectItem>
                  <SelectItem value="CHF">CHF (Franco Suíço)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data-base do Valuation */}
            <div className="space-y-1.5">
              <Label htmlFor="valuation_date">Data-base da Avaliação *</Label>
              <Input
                id="valuation_date"
                type="date"
                value={valuationDate}
                onChange={(e) => setValuationDate(e.target.value)}
                required
              />
            </div>

            {/* Liquidez */}
            <div className="space-y-1.5">
              <Label htmlFor="liquidity">Perfil de Liquidez *</Label>
              <Select value={liquidity} onValueChange={(v: LiquidityLevel) => setLiquidity(v)}>
                <SelectTrigger id="liquidity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta (D+0 a D+5)</SelectItem>
                  <SelectItem value="media">Média (D+6 a D+60)</SelectItem>
                  <SelectItem value="baixa">Baixa (D+61 a D+360)</SelectItem>
                  <SelectItem value="iliquido">Ilíquido (&gt; 1 ano / ilíquido)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Titularidade Direta */}
            <div className="space-y-1.5">
              <Label htmlFor="direct_owner">Titular Direto Formal *</Label>
              <Input
                id="direct_owner"
                placeholder="Ex: Patriarca (Pessoa Física) ou Solaria Ltd"
                value={directOwner}
                onChange={(e) => setDirectOwner(e.target.value)}
                required
              />
            </div>

            {/* Estrutura Detentora */}
            <div className="space-y-1.5">
              <Label htmlFor="holding_structure">Estrutura Detentora *</Label>
              <Select
                value={holdingStructure}
                onValueChange={(v: HoldingStructure) => setHoldingStructure(v)}
              >
                <SelectTrigger id="holding_structure">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HOLDING_STRUCTURE_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Jurisdição */}
            <div className="space-y-1.5">
              <Label htmlFor="jurisdiction_type">Jurisdição *</Label>
              <Select value={jurisdictionType} onValueChange={handleJurisdictionChange}>
                <SelectTrigger id="jurisdiction_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brasil">Brasil (Onshore)</SelectItem>
                  <SelectItem value="offshore">Exterior / Offshore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* País */}
            <div className="space-y-1.5">
              <Label htmlFor="country">País da Jurisdição *</Label>
              <Input
                id="country"
                placeholder="Ex: Brasil, BVI, Suíça, EUA, Portugal"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>

            {/* Titularidade Compartilhada / Conjugal */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="shared_ownership">Regime Conjugal & Titularidade Compartilhada</Label>
              <Input
                id="shared_ownership"
                placeholder="Ex: Comunhão Parcial de Bens; Nua-propriedade doada aos 3 herdeiros com cláusula de incomunicabilidade."
                value={sharedOwnership}
                onChange={(e) => setSharedOwnership(e.target.value)}
              />
            </div>

            {/* Ônus e Gravames */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="encumbrances">Ônus, Gravames e Restrições Legais</Label>
              <Input
                id="encumbrances"
                placeholder="Ex: Reserva de usufruto vitalício, alienação fiduciária, penhora ou lock-up societário."
                value={encumbrances}
                onChange={(e) => setEncumbrances(e.target.value)}
              />
            </div>

            {/* Nível de Evidência E0 - E4 */}
            <div className="space-y-1.5 md:col-span-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="evidence_level" className="font-semibold text-sm">
                  Nível de Evidência Probatória (Manual MFO 2026) *
                </Label>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Ponto de corte material: E2
                </span>
              </div>
              <Select
                value={evidenceLevel}
                onValueChange={(v: EvidenceLevel) => setEvidenceLevel(v)}
              >
                <SelectTrigger id="evidence_level" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVIDENCE_LEVELS).map(([lvl, item]) => (
                    <SelectItem key={lvl} value={lvl}>
                      <span className="font-semibold mr-2">[{item.code}]</span>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notas e Fontes de Evidência Documental */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="evidence_notes">
                  Fontes Documentais da Evidência{' '}
                  {(evidenceLevel === 'E3' || evidenceLevel === 'E4') && (
                    <span className="text-rose-600 font-semibold">* (obrigatório em E3/E4)</span>
                  )}
                </Label>
                <span className="text-xs text-muted-foreground">
                  Identificação das matrículas, laudos, extratos ou atas
                </span>
              </div>
              <Textarea
                id="evidence_notes"
                rows={2}
                placeholder="Ex: Matrícula nº 142.890 do 4º CRI/SP; Laudo Econômico Big 4 emitido em 15/01/2026; Certidão JUCESP nº ..."
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
              />
            </div>

            {/* Observações Gerais de Estratégia Sucessória/Tributária */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Observações Estratégicas MFO (Sucessório & Tributário)</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Ex: Planejamento sucessório antecipado; proteção contra futura majoração do ITCMD progressivo; conformidade com a Lei 14.754/23."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : asset ? 'Salvar Alterações' : 'Cadastrar Ativo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
