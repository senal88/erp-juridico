migrate(
  (app) => {
    if (app.hasTable('processes')) return

    const collection = new Collection({
      name: 'processes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true, max: 200 },
        { name: 'cnj', type: 'text', max: 30 },
        {
          name: 'area',
          type: 'select',
          values: [
            'civil',
            'trabalhista',
            'tributario',
            'empresarial',
            'criminal',
            'familia',
            'previdenciario',
            'consumidor',
            'outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'instance',
          type: 'select',
          values: ['primeira', 'segunda', 'superior'],
          maxSelect: 1,
        },
        { name: 'vara', type: 'text', max: 120 },
        { name: 'comarca', type: 'text', max: 120 },
        { name: 'valor_causa', type: 'number', min: 0 },
        {
          name: 'status',
          type: 'select',
          values: [
            'novo',
            'em_andamento',
            'audiencia_marcada',
            'com_sentenca',
            'em_recurso',
            'arquivado',
            'encerrado',
          ],
          maxSelect: 1,
        },
        { name: 'summary', type: 'editor' },
        {
          name: 'client_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('clients').id,
          maxSelect: 1,
        },
        {
          name: 'responsible_lawyer_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
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
      const collection = app.findCollectionByNameOrId('processes')
      app.delete(collection)
    } catch (_) {}
  },
)
