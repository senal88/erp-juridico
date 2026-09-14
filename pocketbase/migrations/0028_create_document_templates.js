migrate(
  (app) => {
    const collection = new Collection({
      name: 'document_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true, max: 200 },
        {
          name: 'category',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: [
            'peticao_inicial',
            'contestacao',
            'replica',
            'recurso',
            'procuracao',
            'contrato',
            'parecer',
            'notificacao',
            'requerimento',
            'declaracao',
            'outro',
          ],
        },
        { name: 'description', type: 'text', max: 500 },
        { name: 'content', type: 'editor', required: true },
        { name: 'is_active', type: 'bool' },
        { name: 'usage_count', type: 'number', min: 0 },
        {
          name: 'created_by',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_document_templates_category ON document_templates (category)',
        'CREATE INDEX idx_document_templates_is_active ON document_templates (is_active)',
        'CREATE INDEX idx_document_templates_created_by ON document_templates (created_by)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('document_templates')
    app.delete(collection)
  },
)
