migrate(
  (app) => {
    if (app.hasTable('process_parties')) return

    const collection = new Collection({
      name: 'process_parties',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true, max: 200 },
        { name: 'document', type: 'text', max: 30 },
        {
          name: 'role',
          type: 'select',
          required: true,
          values: [
            'autor',
            'reu',
            'terceiro_interessado',
            'perito',
            'testemunha',
            'advogado_contrario',
            'outro',
          ],
          maxSelect: 1,
        },
        { name: 'contact_email', type: 'email' },
        { name: 'contact_phone', type: 'text', max: 30 },
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
      const collection = app.findCollectionByNameOrId('process_parties')
      app.delete(collection)
    } catch (_) {}
  },
)
