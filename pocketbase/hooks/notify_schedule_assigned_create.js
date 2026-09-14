onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const assignedTo = record.getString('assigned_to')

  if (assignedTo) {
    const dateStr = record.getString('starts_at')
    const date = dateStr ? dateStr.substring(0, 16).replace('T', ' ') : ''
    const col = $app.findCollectionByNameOrId('notifications')
    const notif = new Record(col)
    notif.set('recipient', assignedTo)
    notif.set('kind', 'schedule_confirm')
    notif.set('title', 'Novo Agendamento')
    notif.set('body', `Você tem um novo agendamento marcado.`)
    notif.set('schedule_id', record.id)
    notif.set('service_order_id', record.getString('service_order_id'))
    notif.set('link', '/agenda')
    $app.save(notif)
  }
  return e.next()
}, 'os_schedules')
