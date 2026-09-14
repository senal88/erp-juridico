import pb from '@/lib/pocketbase/client'

export interface DocumentTemplate {
  id: string
  name: string
  category: string
  description?: string
  content: string
  is_active: boolean
  usage_count: number
  created_by?: string
  created: string
  updated: string
  expand?: {
    created_by?: {
      id: string
      name: string
      email: string
    }
  }
}

export const getTemplates = (page = 1, perPage = 50, filter = '', sort = '-updated') => {
  return pb.collection('document_templates').getList<DocumentTemplate>(page, perPage, {
    filter,
    sort,
    expand: 'created_by',
  })
}

export const getAllTemplates = (filter = '', sort = '-updated') => {
  return pb.collection('document_templates').getFullList<DocumentTemplate>({
    filter,
    sort,
    expand: 'created_by',
  })
}

export const getTemplate = (id: string) => {
  return pb.collection('document_templates').getOne<DocumentTemplate>(id, {
    expand: 'created_by',
  })
}

export const createTemplate = (data: Partial<DocumentTemplate>) => {
  return pb.collection('document_templates').create<DocumentTemplate>({
    ...data,
    usage_count: 0,
  })
}

export const updateTemplate = (id: string, data: Partial<DocumentTemplate>) => {
  return pb.collection('document_templates').update<DocumentTemplate>(id, data)
}

export const deleteTemplate = (id: string) => {
  return pb.collection('document_templates').delete(id)
}

export const incrementUsage = async (id: string) => {
  const template = await getTemplate(id)
  const currentCount = template.usage_count || 0
  return updateTemplate(id, { usage_count: currentCount + 1 })
}
