import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { getLeads, updateLead, deleteLead, convertLeadToClient, type Lead } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'

import { LeadKpis } from '@/components/leads/LeadKpis'
import { LeadTable } from '@/components/leads/LeadTable'
import { LeadKanban } from '@/components/leads/LeadKanban'
import { LeadSheet } from '@/components/leads/LeadSheet'
import { PageHeader } from '@/components/PageHeader'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [view, setView] = useState<'table' | 'kanban'>(
    () => (localStorage.getItem('leadView') as any) || 'table',
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>()

  const { toast } = useToast()
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      setLeads(await getLeads())
    } catch (err) {
      toast({ title: 'Erro ao carregar leads', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('leads', () => {
    loadData()
  })

  const handleViewChange = (v: 'table' | 'kanban') => {
    setView(v)
    localStorage.setItem('leadView', v)
  }

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter
    return matchesSearch && matchesStatus && matchesSource
  })

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    try {
      await updateLead(id, { status })
      toast({ title: 'Status atualizado com sucesso' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async (lead: Lead) => {
    if (!confirm('Excluir este lead permanentemente?')) return
    try {
      await deleteLead(lead.id)
      toast({ title: 'Lead excluído' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleConvert = async (lead: Lead) => {
    if (!confirm('Converter este lead em cliente? Esta ação não pode ser desfeita.')) return
    try {
      await convertLeadToClient(lead)
      toast({ title: 'Sucesso', description: 'Lead convertido em cliente!' })
      navigate('/clientes')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const openNew = () => {
    setSelectedLead(undefined)
    setSheetOpen(true)
  }
  const openEdit = (l: Lead) => {
    setSelectedLead(l)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Leads"
        description="Pipeline de prospecção comercial"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border bg-muted/50 p-1">
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('table')}
                className="h-8"
              >
                Tabela
              </Button>
              <Button
                variant={view === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('kanban')}
                className="h-8"
              >
                Kanban
              </Button>
            </div>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Novo lead
            </Button>
          </div>
        }
      />

      <LeadKpis leads={leads} />

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome, empresa ou email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {view === 'table' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="contatado">Contatado</SelectItem>
              <SelectItem value="qualificado">Qualificado</SelectItem>
              <SelectItem value="proposta">Proposta</SelectItem>
              <SelectItem value="ganho">Ganho</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Origens</SelectItem>
            <SelectItem value="indicacao">Indicação</SelectItem>
            <SelectItem value="site">Site</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="google_ads">Google Ads</SelectItem>
            <SelectItem value="evento">Evento</SelectItem>
            <SelectItem value="parceiro">Parceiro</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === 'table' ? (
        <LeadTable
          leads={filteredLeads}
          onEdit={openEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
        />
      ) : (
        <LeadKanban leads={filteredLeads} onEdit={openEdit} onStatusChange={handleStatusChange} />
      )}

      <LeadSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        lead={selectedLead}
        onSuccess={() => setSheetOpen(false)}
      />
    </div>
  )
}
