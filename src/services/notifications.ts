import pb from '@/lib/pocketbase/client'

export const getNotifications = () => {
  return pb.collection('notifications').getList(1, 50, {
    sort: '-created',
  })
}

export const markAsRead = (id: string) => {
  return pb.collection('notifications').update(id, {
    read_at: new Date().toISOString(),
  })
}

export const markAllAsRead = () => {
  return pb.send('/backend/v1/notifications/mark-all-read', { method: 'POST' })
}
