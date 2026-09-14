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
    changes.push(record.getBool('archived') ? 'Contrato arquivado' : 'Contrato desarquivado')
  }

  if (record.getFloat('value') !== orig.getFloat('value')) {
    changes.push(`Valor alterado de ${orig.getFloat('value')} para ${record.getFloat('value')}`)
  }

  if (changes.length > 0) {
    const activitiesCol = $app.findCollectionByNameOrId('activities')
    const act = new Record(activitiesCol)
    act.set('description', `Contrato "${record.getString('title')}": ${changes.join(', ')}`)
    act.set('type', 'contract_update')
    if (e.auth) act.set('user_id', e.auth.id)
    $app.save(act)
  }

  e.next()
}, 'contracts')
