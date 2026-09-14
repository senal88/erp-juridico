import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Lead extends RecordModel {
  name: string
  email?: string
  phone?: string
  company?: string
  document?: string
  source?: string
  interest_area?: string
  estimated_value?: number
  score?: number
  status: 'novo' | 'contatado' | 'qualificado' | 'proposta' | 'ganho' | 'perdido'
  owner?: string
  converted_client?: string
  lost_reason?: string
  notes?: string
  last_contact_at?: string
  next_followup_at?: string
  expand?: {
    owner?: RecordModel
    converted_client?: RecordModel
  }
}

export const getLeads = () =>
  pb.collection('leads').getFullList<Lead>({ expand: 'owner,converted_client', sort: '-created' })
export const getLead = (id: string) =>
  pb.collection('leads').getOne<Lead>(id, { expand: 'owner,converted_client' })
export const createLead = (data: Partial<Lead>) => pb.collection('leads').create<Lead>(data)
export const updateLead = (id: string, data: Partial<Lead>) =>
  pb.collection('leads').update<Lead>(id, data)
export const deleteLead = (id: string) => pb.collection('leads').delete(id)

export const convertLeadToClient = async (lead: Lead) => {
  if (lead.status === 'ganho') throw new Error('Lead já foi convertido em cliente.')

  const clientName = lead.company || lead.name

  const client = await pb.collection('clients').create({
    name: clientName,
    email: lead.email || '',
    phone: lead.phone || '',
    status: 'active',
    document: lead.document || '',
  })

  const updatedLead = await updateLead(lead.id, {
    status: 'ganho',
    converted_client: client.id,
  })

  return { lead: updatedLead, client }
}

export const getLeadScoreColor = (score?: number) => {
  if (score === undefined || score === null)
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  if (score < 40) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  if (score < 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400'
}

export const isLeadOverdue = (lead: Lead) => {
  if (!lead.next_followup_at) return false
  if (lead.status === 'ganho' || lead.status === 'perdido') return false
  return new Date(lead.next_followup_at) < new Date()
}

export const calculatePipelineValue = (leads: Lead[]) => {
  return leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)
}
