migrate(
  (app) => {
    try {
      const contracts = app.findRecordsByFilter('contracts', '1=1', '', 1, 0)
      if (contracts && contracts.length > 0) {
        const contract = contracts[0]
        const amCol = app.findCollectionByNameOrId('contract_amendments')
        const record = new Record(amCol)
        record.set('contract_id', contract.id)
        record.set('description', 'Reajuste anual de IPCA')
        record.set('date', new Date().toISOString())
        record.set('value_change', 150.0)
        app.save(record)
      }
    } catch (err) {
      // ignore
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('contract_amendments', '1=1', '', 100, 0)
      for (const r of records) {
        app.delete(r)
      }
    } catch (err) {}
  },
)
