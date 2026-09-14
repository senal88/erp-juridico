import pb from '@/lib/pocketbase/client'

export const getServiceOrders = () =>
  pb.collection('service_orders').getFullList({ sort: '-created', expand: 'client_id,contrato_id' })

export interface GetServiceOrdersOptions {
  page?: number
  perPage?: number
  search?: string
  status?: string
  priority?: string
  showArchived?: boolean
}

export const getServiceOrdersPage = async (options: GetServiceOrdersOptions) => {
  const { page = 1, perPage = 25, search, status, priority, showArchived } = options
  const filters: string[] = []

  if (showArchived) {
    filters.push(`archived = true`)
  } else {
    filters.push(`(archived = false || archived = null)`)
  }

  if (search) {
    filters.push(`(title ~ "${search}" || description ~ "${search}")`)
  }
  if (status && status !== 'all') {
    filters.push(`status = "${status}"`)
  }
  if (priority && priority !== 'all') {
    filters.push(`priority = "${priority}"`)
  }

  const filter = filters.length > 0 ? filters.join(' && ') : ''

  return pb.collection('service_orders').getList(page, perPage, {
    filter,
    sort: '-created',
    expand: 'client_id,contrato_id',
  })
}

export const getServiceOrdersCount = async (filter: string) => {
  const res = await pb.collection('service_orders').getList(1, 1, { filter })
  return res.totalItems
}

export const getRecentServiceOrders = () => {
  return pb.collection('service_orders').getList(1, 5, {
    sort: '-created',
    expand: 'client_id',
  })
}

export const createServiceOrder = (data: any) => pb.collection('service_orders').create(data)
export const updateServiceOrder = (id: string, data: any) =>
  pb.collection('service_orders').update(id, data)
export const deleteServiceOrder = (id: string) => pb.collection('service_orders').delete(id)
