migrate(
  (app) => {
    if (app.hasTable('process_hearings')) return

    const collection = new Collection({
      name: 'process_hearings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'time', type: 'text', max: 5 },
        {
          name: 'type',
          type: 'select',
          values: [
            'instrucao',
            'conciliacao',
            'mediacao',
            'julgamento',
            'depoimento_pessoal',
            'oitiva_testemunhas',
            'outra',
          ],
          maxSelect: 1,
        },
        { name: 'vara', type: 'text', max: 120 },
        { name: 'judge', type: 'text', max: 120 },
        { name: 'mandatory', type: 'bool' },
        {
          name: 'status',
          type: 'select',
          values: ['agendada', 'realizada', 'cancelada', 'adiada'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
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
      const collection = app.findCollectionByNameOrId('process_hearings')
      app.delete(collection)
    } catch (_) {}
  },
)
