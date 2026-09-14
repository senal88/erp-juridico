migrate(
  (app) => {
    const clientsCol = app.findCollectionByNameOrId('clients')
    const processesCol = app.findCollectionByNameOrId('processes')

    const collection = new Collection({
      name: 'fees',
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
          values: ['fixo', 'exito', 'recorrente', 'sucumbencial', 'consulta'],
        },
        { name: 'amount', type: 'number', min: 0 },
        { name: 'percentage', type: 'number', min: 0 },
        {
          name: 'billing_basis',
          type: 'select',
          maxSelect: 1,
          values: ['valor_causa', 'acordo', 'condenacao', 'valor_contratado', 'outra'],
        },
        {
          name: 'recurrence',
          type: 'select',
          maxSelect: 1,
          values: ['unica', 'mensal', 'trimestral', 'anual'],
        },
        { name: 'due_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['pendente', 'cobrado', 'recebido', 'cancelado'],
        },
        { name: 'received_at', type: 'date' },
        { name: 'notes', type: 'text' },
        {
          name: 'client',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: clientsCol.id,
        },
        { name: 'process', type: 'relation', maxSelect: 1, collectionId: processesCol.id },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('fees')
    app.delete(collection)
  },
)
