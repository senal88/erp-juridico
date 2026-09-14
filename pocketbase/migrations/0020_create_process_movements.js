migrate(
  (app) => {
    if (app.hasTable('process_movements')) return

    const collection = new Collection({
      name: 'process_movements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'date', type: 'date', required: true },
        {
          name: 'type',
          type: 'select',
          values: [
            'distribuicao',
            'despacho',
            'decisao',
            'sentenca',
            'intimacao',
            'juntada',
            'peticao',
            'audiencia',
            'recurso',
            'arquivamento',
            'outro',
          ],
          maxSelect: 1,
        },
        { name: 'description', type: 'editor', required: true },
        { name: 'source', type: 'select', values: ['manual', 'importado'], maxSelect: 1 },
        { name: 'is_critical', type: 'bool' },
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
      const collection = app.findCollectionByNameOrId('process_movements')
      app.delete(collection)
    } catch (_) {}
  },
)
