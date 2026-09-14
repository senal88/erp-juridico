migrate(
  (app) => {
    const processesCol = app.findCollectionByNameOrId('processes')

    const collection = new Collection({
      name: 'expenses',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true, max: 200 },
        {
          name: 'kind',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: [
            'custas',
            'cartorio',
            'pericia',
            'copias',
            'transporte',
            'estacionamento',
            'correios',
            'outras',
          ],
        },
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'date_incurred', type: 'date', required: true },
        { name: 'reimbursable', type: 'bool' },
        { name: 'reimbursed', type: 'bool' },
        { name: 'reimbursed_at', type: 'date' },
        { name: 'description', type: 'text' },
        {
          name: 'receipt',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'paid_by', type: 'relation', maxSelect: 1, collectionId: '_pb_users_auth_' },
        {
          name: 'process',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: processesCol.id,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('expenses')
    app.delete(collection)
  },
)
