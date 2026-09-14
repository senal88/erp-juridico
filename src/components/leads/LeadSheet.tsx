import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Lead, createLead, updateLead, convertLeadToClient } from '@/services/leads'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead
  onSuccess: () => void
}

export function LeadSheet({ open, onOpenChange, lead, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>(lead?.status || 'novo')
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (open) setStatus(lead?.status || 'novo')
  }, [open, lead])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as any

    if (data.estimated_value) data.estimated_value = Number(data.estimated_value)
    else delete data.estimated_value

    if (data.score) data.score = Number(data.score)
    else delete data.score

    if (!data.last_contact_at) delete data.last_contact_at
    else data.last_contact_at = new Date(data.last_contact_at).toISOString()

    if (!data.next_followup_at) delete data.next_followup_at
    else data.next_followup_at = new Date(data.next_followup_at).toISOString()

    if (status !== 'perdido') delete data.lost_reason

    try {
      if (lead) await updateLead(lead.id, data)
      else await createLead({ ...data, owner: pb.authStore.record?.id })
      toast({ title: 'Sucesso', description: 'Lead salvo com sucesso.' })
      onSuccess()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (
      !lead ||
      !confirm(
        'Converter este lead em cliente? Esta ação criará um registro e não pode ser desfeita.',
      )
    )
      return
    try {
      setLoading(true)
      await convertLeadToClient(lead)
      toast({ title: 'Sucesso', description: 'Lead convertido em cliente!' })
      onSuccess()
      navigate('/clientes')
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (d?: string) => {
    if (!d) return ''
    try {
      return format(new Date(d), "yyyy-MM-dd'T'HH:mm")
    } catch {
      return ''
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</SheetTitle>
          <SheetDescription>
            Gerencie as informações e o acompanhamento desta oportunidade.
          </SheetDescription>
        </SheetHeader>
        <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                Informações Básicas
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input name="name" defaultValue={lead?.name} required />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input name="company" defaultValue={lead?.company} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={lead?.email} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input name="phone" defaultValue={lead?.phone} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>CPF/CNPJ</Label>
                <Input name="document" defaultValue={lead?.document} />
              </div>
            </div>

            <div className="border-b pb-2 mt-6">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                Qualificação
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select name="source" defaultValue={lead?.source || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
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
              <div className="space-y-2">
                <Label>Área de Interesse</Label>
                <Select name="interest_area" defaultValue={lead?.interest_area || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="tributario">Tributário</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="previdenciario">Previdenciário</SelectItem>
                    <SelectItem value="consumidor">Consumidor</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor Estimado (R$)</Label>
                <Input
                  name="estimated_value"
                  type="number"
                  step="0.01"
                  defaultValue={lead?.estimated_value}
                />
              </div>
              <div className="space-y-2">
                <Label>Score (0-100)</Label>
                <Input name="score" type="number" min="0" max="100" defaultValue={lead?.score} />
              </div>
            </div>

            <div className="border-b pb-2 mt-6">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                Status & Acompanhamento
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  name="status"
                  value={status}
                  onValueChange={(v: any) => setStatus(v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="contatado">Contatado</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="ganho">Ganho</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2" />

              {status === 'perdido' && (
                <div className="space-y-2 col-span-2">
                  <Label>Motivo da Perda</Label>
                  <Textarea name="lost_reason" defaultValue={lead?.lost_reason} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Último Contato</Label>
                <Input
                  name="last_contact_at"
                  type="datetime-local"
                  defaultValue={formatDateForInput(lead?.last_contact_at)}
                />
              </div>
              <div className="space-y-2">
                <Label>Próximo Follow-up</Label>
                <Input
                  name="next_followup_at"
                  type="datetime-local"
                  defaultValue={formatDateForInput(lead?.next_followup_at)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Notas Adicionais</Label>
                <Textarea name="notes" defaultValue={lead?.notes} rows={3} />
              </div>
            </div>
          </div>

          <SheetFooter className="flex-col sm:flex-row gap-3 pt-6 border-t mt-8">
            {lead && status !== 'ganho' && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleConvert}
                disabled={loading}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Converter em Cliente
              </Button>
            )}
            <Button type="submit" className="w-full sm:w-auto sm:ml-auto" disabled={loading}>
              Salvar Lead
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
