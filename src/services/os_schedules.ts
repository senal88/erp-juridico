import pb from '@/lib/pocketbase/client'

export const getSchedules = (filter = '', expand = 'service_order_id.client_id,assigned_to') =>
  pb.collection('os_schedules').getFullList({
    filter,
    sort: 'starts_at',
    expand,
  })

export const getSchedulesCount = async (filter: string) => {
  const res = await pb.collection('os_schedules').getList(1, 1, { filter })
  return res.totalItems
}

export const getSchedule = (id: string) =>
  pb.collection('os_schedules').getOne(id, { expand: 'service_order_id,assigned_to' })

export const createSchedule = (data: any) => pb.collection('os_schedules').create(data)
export const updateSchedule = (id: string, data: any) =>
  pb.collection('os_schedules').update(id, data)
export const deleteSchedule = (id: string) => pb.collection('os_schedules').delete(id)
