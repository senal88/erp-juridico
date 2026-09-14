import pb from '@/lib/pocketbase/client'

// --- Types ---

export type ProcessArea =
  | 'civil'
  | 'trabalhista'
  | 'tributario'
  | 'empresarial'
  | 'criminal'
  | 'familia'
  | 'previdenciario'
  | 'consumidor'
  | 'outro'
export type ProcessInstance = 'primeira' | 'segunda' | 'superior'
export type ProcessStatus =
  | 'novo'
  | 'em_andamento'
  | 'audiencia_marcada'
  | 'com_sentenca'
  | 'em_recurso'
  | 'arquivado'
  | 'encerrado'

export interface Process {
  id: string
  title: string
  cnj?: string
  area?: ProcessArea
  instance?: ProcessInstance
  vara?: string
  comarca?: string
  valor_causa?: number
  status?: ProcessStatus
  summary?: string
  client_id: string
  responsible_lawyer_id?: string
  created: string
  updated: string
  expand?: any
}

export type ProcessPartyRole =
  | 'autor'
  | 'reu'
  | 'terceiro_interessado'
  | 'perito'
  | 'testemunha'
  | 'advogado_contrario'
  | 'outro'

export interface ProcessParty {
  id: string
  name: string
  document?: string
  role: ProcessPartyRole
  contact_email?: string
  contact_phone?: string
  notes?: string
  process_id: string
  created: string
  updated: string
  expand?: any
}

export type ProcessMovementType =
  | 'distribuicao'
  | 'despacho'
  | 'decisao'
  | 'sentenca'
  | 'intimacao'
  | 'juntada'
  | 'peticao'
  | 'audiencia'
  | 'recurso'
  | 'arquivamento'
  | 'outro'
export type MovementSource = 'manual' | 'importado'

export interface ProcessMovement {
  id: string
  date: string
  type?: ProcessMovementType
  description: string
  source?: MovementSource
  is_critical?: boolean
  process_id: string
  created: string
  updated: string
  expand?: any
}

export type ProcessHearingType =
  | 'instrucao'
  | 'conciliacao'
  | 'mediacao'
  | 'julgamento'
  | 'depoimento_pessoal'
  | 'oitiva_testemunhas'
  | 'outra'
export type ProcessHearingStatus = 'agendada' | 'realizada' | 'cancelada' | 'adiada'

export interface ProcessHearing {
  id: string
  date: string
  time?: string
  type?: ProcessHearingType
  vara?: string
  judge?: string
  mandatory?: boolean
  status?: ProcessHearingStatus
  notes?: string
  process_id: string
  created: string
  updated: string
  expand?: any
}

export type DeadlineType = 'legal' | 'interno'
export type DeadlineStatus = 'aberto' | 'cumprido' | 'expirado' | 'cancelado'

export interface ProcessDeadline {
  id: string
  title: string
  description?: string
  due_date: string
  type: DeadlineType
  status?: DeadlineStatus
  penalty_note?: string
  responsible_id?: string
  process_id: string
  created: string
  updated: string
  expand?: any
}

export type DocumentKind =
  | 'peticao_inicial'
  | 'contestacao'
  | 'replica'
  | 'recurso'
  | 'decisao'
  | 'sentenca'
  | 'procuracao'
  | 'contrato'
  | 'parecer'
  | 'comprovante'
  | 'outro'

export interface ProcessDocument {
  id: string
  collectionId?: string
  collectionName?: string
  title: string
  kind?: DocumentKind
  file?: string
  version?: number
  notes?: string
  uploaded_by_id?: string
  process_id: string
  created: string
  updated: string
  expand?: any
}

// --- Process Services ---

export const getProcesses = (page = 1, perPage = 50, filter = '') =>
  pb.collection('processes').getList<Process>(page, perPage, {
    expand: 'client_id,responsible_lawyer_id',
    sort: '-created',
    filter,
  })

export const getFullProcesses = (filter = '') =>
  pb.collection('processes').getFullList<Process>({
    expand: 'client_id,responsible_lawyer_id',
    sort: '-created',
    filter,
  })

export const getProcess = (id: string) =>
  pb.collection('processes').getOne<Process>(id, {
    expand: 'client_id,responsible_lawyer_id',
  })

export const createProcess = (data: Partial<Process>) =>
  pb.collection('processes').create<Process>(data)

export const updateProcess = (id: string, data: Partial<Process>) =>
  pb.collection('processes').update<Process>(id, data)

export const deleteProcess = (id: string) => pb.collection('processes').delete(id)

// --- Process Party Services ---

export const getProcessParties = (processId: string) =>
  pb.collection('process_parties').getFullList<ProcessParty>({
    filter: `process_id = "${processId}"`,
    sort: 'role,name',
  })

export const createProcessParty = (data: Partial<ProcessParty>) =>
  pb.collection('process_parties').create<ProcessParty>(data)

export const updateProcessParty = (id: string, data: Partial<ProcessParty>) =>
  pb.collection('process_parties').update<ProcessParty>(id, data)

export const deleteProcessParty = (id: string) => pb.collection('process_parties').delete(id)

// --- Process Movement Services ---

export const getProcessMovements = (processId: string) =>
  pb.collection('process_movements').getFullList<ProcessMovement>({
    filter: `process_id = "${processId}"`,
    sort: '-date,-created',
  })

export const createProcessMovement = (data: Partial<ProcessMovement>) =>
  pb.collection('process_movements').create<ProcessMovement>(data)

export const updateProcessMovement = (id: string, data: Partial<ProcessMovement>) =>
  pb.collection('process_movements').update<ProcessMovement>(id, data)

export const deleteProcessMovement = (id: string) => pb.collection('process_movements').delete(id)

// --- Process Hearing Services ---

export const getProcessHearings = (processId: string) =>
  pb.collection('process_hearings').getFullList<ProcessHearing>({
    filter: `process_id = "${processId}"`,
    sort: 'date,time',
  })

export const createProcessHearing = (data: Partial<ProcessHearing>) =>
  pb.collection('process_hearings').create<ProcessHearing>(data)

export const updateProcessHearing = (id: string, data: Partial<ProcessHearing>) =>
  pb.collection('process_hearings').update<ProcessHearing>(id, data)

export const deleteProcessHearing = (id: string) => pb.collection('process_hearings').delete(id)

export const listUpcomingHearings = (days = 7) => {
  const today = new Date()
  const end = new Date()
  end.setDate(today.getDate() + days)

  const todayStr = today.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  return pb.collection('process_hearings').getFullList<ProcessHearing>({
    filter: `status = 'agendada' && date >= "${todayStr}" && date <= "${endStr}"`,
    expand: 'process_id,process_id.client_id',
    sort: 'date,time',
  })
}

// --- Process Deadline Services ---

export const getProcessDeadlines = (processId: string) =>
  pb.collection('process_deadlines').getFullList<ProcessDeadline>({
    filter: `process_id = "${processId}"`,
    expand: 'responsible_id',
    sort: 'due_date',
  })

export const createProcessDeadline = (data: Partial<ProcessDeadline>) =>
  pb.collection('process_deadlines').create<ProcessDeadline>(data)

export const updateProcessDeadline = (id: string, data: Partial<ProcessDeadline>) =>
  pb.collection('process_deadlines').update<ProcessDeadline>(id, data)

export const deleteProcessDeadline = (id: string) => pb.collection('process_deadlines').delete(id)

export const listOpenDeadlines = (days = 7) => {
  const today = new Date()
  const end = new Date()
  end.setDate(today.getDate() + days)

  const todayStr = today.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  return pb.collection('process_deadlines').getFullList<ProcessDeadline>({
    filter: `status = 'aberto' && due_date >= "${todayStr}" && due_date <= "${endStr}"`,
    expand: 'process_id,process_id.client_id,responsible_id',
    sort: 'due_date',
  })
}

// --- Process Document Services ---

export const getProcessDocuments = (processId: string) =>
  pb.collection('process_documents').getFullList<ProcessDocument>({
    filter: `process_id = "${processId}"`,
    expand: 'uploaded_by_id',
    sort: '-created',
  })

export const uploadProcessDocument = (data: FormData) =>
  pb.collection('process_documents').create<ProcessDocument>(data)

export const updateProcessDocument = (id: string, data: Partial<ProcessDocument>) =>
  pb.collection('process_documents').update<ProcessDocument>(id, data)

export const deleteProcessDocument = (id: string) => pb.collection('process_documents').delete(id)

export const getFileUrl = (record: ProcessDocument, filename?: string) => {
  if (!filename && !record.file) return ''
  return pb.files.getURL(record as any, filename || record.file!)
}
