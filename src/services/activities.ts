import pb from '@/lib/pocketbase/client'

export const getActivities = () =>
  pb.collection('activities').getList(1, 500, { sort: '-created', expand: 'user_id' })
