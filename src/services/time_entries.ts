import pb from '@/lib/pocketbase/client'

export interface TimeEntry {
  id: string
  description: string
  duration_minutes: number
  date: string
  category: 'drafting' | 'hearing' | 'meeting' | 'research' | 'phone' | 'email' | 'other'
  is_billable: boolean
  hourly_rate?: number
  status: 'registrada' | 'cobrada' | 'descartada'
  user: string
  client?: string
  process?: string
  fee?: string
  created: string
  updated: string
  expand?: {
    user?: { id: string; name: string; email: string }
    client?: { id: string; name: string }
    process?: { id: string; title: string; cnj?: string }
  }
}

export const getTimeEntries = (page = 1, perPage = 50, filter = '') =>
  pb.collection('time_entries').getList<TimeEntry>(page, perPage, {
    sort: '-date',
    filter,
    expand: 'user,client,process',
  })

export const getTimeEntriesByProcess = (processId: string) =>
  pb.collection('time_entries').getFullList<TimeEntry>({
    filter: `process = "${processId}"`,
    sort: '-date',
    expand: 'user,client,process',
  })

export const getTimeEntriesByUser = (userId: string, additionalFilter = '') => {
  const filter = `user = "${userId}"${additionalFilter ? ` && ${additionalFilter}` : ''}`
  return pb.collection('time_entries').getFullList<TimeEntry>({
    filter,
    sort: '-date',
    expand: 'user,client,process',
  })
}

export const getTimeEntry = (id: string) =>
  pb.collection('time_entries').getOne<TimeEntry>(id, {
    expand: 'user,client,process',
  })

export const createTimeEntry = (data: Partial<TimeEntry>) =>
  pb.collection('time_entries').create<TimeEntry>(data)

export const updateTimeEntry = (id: string, data: Partial<TimeEntry>) =>
  pb.collection('time_entries').update<TimeEntry>(id, data)

export const deleteTimeEntry = (id: string) => pb.collection('time_entries').delete(id)
