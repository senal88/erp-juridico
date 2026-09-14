onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const orig = e.record.original()
  const changes = []

  if (record.getString('status') !== orig.getString('status')) {
    changes.push(
      `Status alterado de "${orig.getString('status')}" para "${record.getString('status')}"`,
    )
  }

  if (record.getBool('archived') !== orig.getBool('archived')) {
    changes.push(record.getBool('archived') ? 'OS arquivada' : 'OS desarquivada')
  }

  const newAssigned = record.getString('assigned_to')
  const oldAssigned = orig.getString('assigned_to')

  if (newAssigned !== oldAssigned) {
    let oldName = 'Ninguém'
    let newName = 'Ninguém'

    try {
      if (oldAssigned) {
        oldName = $app.findRecordById('users', oldAssigned).getString('name') || oldName
      }
    } catch (err) {}

    try {
      if (newAssigned) {
        newName = $app.findRecordById('users', newAssigned).getString('name') || newName
      }
    } catch (err) {}

    changes.push(`Atribuição: "${oldName}" → "${newName}"`)
  }

  if (changes.length > 0) {
    const activitiesCol = $app.findCollectionByNameOrId('activities')
    const act = new Record(activitiesCol)
    act.set('description', `OS "${record.getString('title')}": ${changes.join(', ')}`)
    act.set('type', 'os_update')
    if (e.auth) act.set('user_id', e.auth.id)
    $app.save(act)
  }

  e.next()
}, 'service_orders')
