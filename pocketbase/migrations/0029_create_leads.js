migrate(
  (app) => {
    const collection = new Collection({
      name: 'leads',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'company', type: 'text' },
        { name: 'document', type: 'text' },
        {
          name: 'source',
          type: 'select',
          values: [
            'indicacao',
            'site',
            'whatsapp',
            'instagram',
            'linkedin',
            'google_ads',
            'evento',
            'parceiro',
            'outro',
          ],
        },
        {
          name: 'interest_area',
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
        },
        { name: 'estimated_value', type: 'number' },
        { name: 'score', type: 'number', min: 0, max: 100 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['novo', 'contatado', 'qualificado', 'proposta', 'ganho', 'perdido'],
        },
        { name: 'owner', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        {
          name: 'converted_client',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clients').id,
          maxSelect: 1,
        },
        { name: 'lost_reason', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'last_contact_at', type: 'date' },
        { name: 'next_followup_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_leads_status ON leads (status)',
        'CREATE INDEX idx_leads_owner ON leads (owner)',
        'CREATE INDEX idx_leads_source ON leads (source)',
        'CREATE INDEX idx_leads_next_followup_at ON leads (next_followup_at)',
        'CREATE INDEX idx_leads_converted_client ON leads (converted_client)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('leads')
    app.delete(collection)
  },
)
