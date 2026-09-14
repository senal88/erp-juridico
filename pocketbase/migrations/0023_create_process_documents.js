migrate(
  (app) => {
    if (app.hasTable('process_documents')) return

    const collection = new Collection({
      name: 'process_documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true, max: 200 },
        {
          name: 'kind',
          type: 'select',
          values: [
            'peticao_inicial',
            'contestacao',
            'replica',
            'recurso',
            'decisao',
            'sentenca',
            'procuracao',
            'contrato',
            'parecer',
            'comprovante',
            'outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'file',
          type: 'file',
          maxSize: 52428800,
          mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
          ],
          maxSelect: 1,
        },
        { name: 'version', type: 'number', min: 1 },
        { name: 'notes', type: 'text' },
        { name: 'uploaded_by_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
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
      const collection = app.findCollectionByNameOrId('process_documents')
      app.delete(collection)
    } catch (_) {}
  },
)
