onRecordAfterCreateSuccess((e) => {
  const schedule = e.record
  const osId = schedule.getString('service_order_id')
  if (!osId) return e.next()

  try {
    let nextDate = ''
    const nextSchedules = $app.findRecordsByFilter(
      'os_schedules',
      `service_order_id = '${osId}' && (status = 'scheduled' || status = 'confirmed' || status = 'in_progress') && starts_at >= @now`,
      'starts_at',
      1,
      0,
    )
    if (nextSchedules.length > 0) {
      nextDate = nextSchedules[0].getString('starts_at')
    }

    const os = $app.findRecordById('service_orders', osId)
    os.set('scheduled_at', nextDate)

    const status = schedule.getString('status')
    if (status === 'in_progress') os.set('status', 'in_progress')
    else if (status === 'completed') os.set('status', 'completed')

    $app.save(os)
  } catch (err) {}

  return e.next()
}, 'os_schedules')

onRecordAfterUpdateSuccess((e) => {
  const schedule = e.record
  const osId = schedule.getString('service_order_id')
  if (!osId) return e.next()

  try {
    let nextDate = ''
    const nextSchedules = $app.findRecordsByFilter(
      'os_schedules',
      `service_order_id = '${osId}' && (status = 'scheduled' || status = 'confirmed' || status = 'in_progress') && starts_at >= @now`,
      'starts_at',
      1,
      0,
    )
    if (nextSchedules.length > 0) {
      nextDate = nextSchedules[0].getString('starts_at')
    }

    const os = $app.findRecordById('service_orders', osId)
    os.set('scheduled_at', nextDate)

    const status = schedule.getString('status')
    if (status === 'in_progress') os.set('status', 'in_progress')
    else if (status === 'completed') os.set('status', 'completed')

    $app.save(os)
  } catch (err) {}

  return e.next()
}, 'os_schedules')

onRecordAfterDeleteSuccess((e) => {
  const schedule = e.record
  const osId = schedule.getString('service_order_id')
  if (!osId) return e.next()

  try {
    let nextDate = ''
    const nextSchedules = $app.findRecordsByFilter(
      'os_schedules',
      `service_order_id = '${osId}' && (status = 'scheduled' || status = 'confirmed' || status = 'in_progress') && starts_at >= @now`,
      'starts_at',
      1,
      0,
    )
    if (nextSchedules.length > 0) {
      nextDate = nextSchedules[0].getString('starts_at')
    }

    const os = $app.findRecordById('service_orders', osId)
    os.set('scheduled_at', nextDate)
    $app.save(os)
  } catch (err) {}

  return e.next()
}, 'os_schedules')
