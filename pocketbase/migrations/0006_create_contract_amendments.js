migrate(
  (app) => {
    const collection = new Collection({
      name: 'contract_amendments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'contract_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('contracts').id,
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'value_change', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contract_amendments_contract ON contract_amendments (contract_id)',
        'CREATE INDEX idx_contract_amendments_date ON contract_amendments (date DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('contract_amendments')
    app.delete(collection)
  },
)
