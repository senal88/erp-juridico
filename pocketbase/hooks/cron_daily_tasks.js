cronAdd('daily_alerts', '0 8 * * *', () => {
  const notifCol = $app.findCollectionByNameOrId('notifications')

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setUTCHours(23, 59, 59, 999)

  const startStr = todayStart.toISOString().replace('T', ' ').substring(0, 19) + 'Z'
  const endStr = todayEnd.toISOString().replace('T', ' ').substring(0, 19) + 'Z'

  const schedules = $app.findRecordsByFilter(
    'os_schedules',
    `starts_at >= '${startStr}' && starts_at <= '${endStr}' && (status = 'scheduled' || status = 'confirmed')`,
    '',
    1000,
    0,
  )

  for (const sched of schedules) {
    const assignedTo = sched.getString('assigned_to')
    if (assignedTo) {
      const notif = new Record(notifCol)
      notif.set('recipient', assignedTo)
      notif.set('kind', 'schedule_today')
      notif.set('title', 'Agendamento Hoje')
      notif.set('body', `Você tem um agendamento marcado para hoje.`)
      notif.set('schedule_id', sched.id)
      notif.set('service_order_id', sched.getString('service_order_id'))
      notif.set('link', '/agenda')
      $app.save(notif)
    }
  }

  const future30 = new Date()
  future30.setDate(future30.getDate() + 30)
  const future30Str = future30.toISOString().replace('T', ' ').substring(0, 19) + 'Z'

  const expiringContracts = $app.findRecordsByFilter(
    'contracts',
    `status = 'active' && vigencia_fim <= '${future30Str}' && vigencia_fim > '${startStr}'`,
    '',
    1000,
    0,
  )
  const users = $app.findRecordsByFilter('users', 'id != ""', '', 100, 0)

  for (const contract of expiringContracts) {
    const title = contract.getString('title')
    for (const user of users) {
      const notif = new Record(notifCol)
      notif.set('recipient', user.id)
      notif.set('kind', 'contract_expiring')
      notif.set('title', 'Contrato Expirando')
      notif.set('body', `O contrato "${title}" irá expirar em breve.`)
      notif.set('contract_id', contract.id)
      notif.set('link', '/contratos')
      $app.save(notif)
    }
  }

  const expiredContracts = $app.findRecordsByFilter(
    'contracts',
    `status = 'active' && vigencia_fim <= '${startStr}'`,
    '',
    1000,
    0,
  )

  for (const contract of expiredContracts) {
    contract.set('status', 'expired')
    $app.save(contract)
    const title = contract.getString('title')

    for (const user of users) {
      const notif = new Record(notifCol)
      notif.set('recipient', user.id)
      notif.set('kind', 'contract_expired')
      notif.set('title', 'Contrato Expirado')
      notif.set('body', `O contrato "${title}" expirou e seu status foi atualizado.`)
      notif.set('contract_id', contract.id)
      notif.set('link', '/contratos')
      $app.save(notif)
    }
  }
})
