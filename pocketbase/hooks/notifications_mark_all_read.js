routerAdd(
  'POST',
  '/backend/v1/notifications/mark-all-read',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const unread = $app.findRecordsByFilter(
      'notifications',
      `recipient = '${userId}' && read_at = ''`,
      '',
      1000,
      0,
    )
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z'

    for (const notif of unread) {
      notif.set('read_at', now)
      $app.save(notif)
    }

    return e.json(200, { success: true, count: unread.length })
  },
  $apis.requireAuth(),
)
