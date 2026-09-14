migrate(
  (app) => {
    if (app.hasTable('process_deadlines')) return

    const collection = new Collection({
      name: 'process_deadlines',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true, max: 200 },
        { name: 'description', type: 'text' },
        { name: 'due_date', type: 'date', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['legal', 'interno'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['aberto', 'cumprido', 'expirado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'penalty_note', type: 'text' },
        { name: 'responsible_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'process_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('processes').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('process_deadlines')
      app.delete(collection)
    } catch (_) {}
  },
)
