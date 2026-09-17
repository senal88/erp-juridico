migrate(
  (app) => {
    if (app.hasTable('patrimonial_assets')) return

    const staffRule =
      "@request.auth.role = 'admin' || @request.auth.role = 'consultor' || @request.auth.role = 'lawyer'"
    const clientRule = "(@request.auth.role = 'cliente' && client_id.user = @request.auth.id)"

    const clientsCol = app.findCollectionByNameOrId('clients')

    const collection = new Collection({
      name: 'patrimonial_assets',
      type: 'base',
      listRule: `${staffRule} || ${clientRule}`,
      viewRule: `${staffRule} || ${clientRule}`,
      createRule: staffRule,
      updateRule: staffRule,
      deleteRule: "@request.auth.role = 'admin' || @request.auth.role = 'lawyer'",
      fields: [
        { name: 'name', type: 'text', required: true, max: 250 },
        { name: 'description', type: 'text', max: 1000 },
        {
          name: 'asset_type',
          type: 'select',
          required: true,
          values: ['asset', 'liability'],
          maxSelect: 1,
        },
        {
          name: 'asset_class',
          type: 'select',
          required: true,
          values: [
            'real_estate',
            'corporate_stake',
            'financial_investments',
            'vehicles_tangible',
            'intellectual_property',
            'crypto_digital',
            'other',
          ],
          maxSelect: 1,
        },
        { name: 'valuation_value', type: 'number', required: true, min: 0 },
        { name: 'valuation_date', type: 'date', required: true },
        {
          name: 'currency',
          type: 'select',
          required: true,
          values: ['BRL', 'USD', 'EUR', 'GBP', 'CHF'],
          maxSelect: 1,
        },
        { name: 'direct_owner', type: 'text', required: true, max: 200 },
        { name: 'shared_ownership', type: 'text', max: 300 },
        {
          name: 'holding_structure',
          type: 'select',
          required: true,
          values: [
            'individual',
            'holding_familiar',
            'holding_operacional',
            'offshore_pic',
            'trust',
            'fund_exclusive',
            'condominio_patrimonial',
            'outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'jurisdiction_type',
          type: 'select',
          required: true,
          values: ['brasil', 'offshore'],
          maxSelect: 1,
        },
        { name: 'country', type: 'text', required: true, max: 100 },
        { name: 'encumbrances', type: 'text', max: 400 },
        {
          name: 'liquidity',
          type: 'select',
          required: true,
          values: ['alta', 'media', 'baixa', 'iliquido'],
          maxSelect: 1,
        },
        {
          name: 'evidence_level',
          type: 'select',
          required: true,
          values: ['E0', 'E1', 'E2', 'E3', 'E4'],
          maxSelect: 1,
        },
        { name: 'valid_for_material_decision', type: 'bool' },
        {
          name: 'evidence_document_file',
          type: 'file',
          maxSelect: 5,
          maxSize: 20971520, // 20MB
        },
        { name: 'evidence_notes', type: 'text', max: 1000 },
        { name: 'notes', type: 'text', max: 2000 },
        {
          name: 'client_id',
          type: 'relation',
          required: true,
          collectionId: clientsCol.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_patrimonial_client ON patrimonial_assets (client_id)',
        'CREATE INDEX idx_patrimonial_class ON patrimonial_assets (asset_class)',
        'CREATE INDEX idx_patrimonial_type ON patrimonial_assets (asset_type)',
        'CREATE INDEX idx_patrimonial_evidence ON patrimonial_assets (evidence_level)',
        'CREATE INDEX idx_patrimonial_jurisdiction ON patrimonial_assets (jurisdiction_type)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('patrimonial_assets')
      app.delete(collection)
    } catch (_) {}
  },
)
