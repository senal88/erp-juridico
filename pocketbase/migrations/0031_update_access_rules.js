migrate(
  (app) => {
    const staffRule =
      "@request.auth.role = 'admin' || @request.auth.role = 'consultor' || @request.auth.role = 'lawyer'"

    const readAccess = [
      {
        collection: 'processes',
        rule: "(@request.auth.role = 'cliente' && client_id.user = @request.auth.id)",
      },
      {
        collection: 'process_movements',
        rule: "(@request.auth.role = 'cliente' && process_id.client_id.user = @request.auth.id)",
      },
      {
        collection: 'process_hearings',
        rule: "(@request.auth.role = 'cliente' && process_id.client_id.user = @request.auth.id)",
      },
      {
        collection: 'process_documents',
        rule: "(@request.auth.role = 'cliente' && process_id.client_id.user = @request.auth.id)",
      },
      {
        collection: 'process_deadlines',
        rule: "(@request.auth.role = 'cliente' && process_id.client_id.user = @request.auth.id)",
      },
      {
        collection: 'invoices',
        rule: "(@request.auth.role = 'cliente' && client.user = @request.auth.id)",
      },
      {
        collection: 'clients',
        rule: "(@request.auth.role = 'cliente' && user = @request.auth.id)",
      },
    ]

    for (const item of readAccess) {
      try {
        const col = app.findCollectionByNameOrId(item.collection)

        const applyReadRule = (current) => {
          if (!current || current === "@request.auth.id != ''") {
            return `${staffRule} || ${item.rule}`
          }
          return current
        }

        const applyWriteRule = (current) => {
          if (!current || current === "@request.auth.id != ''") {
            return staffRule
          }
          return current
        }

        col.listRule = applyReadRule(col.listRule)
        col.viewRule = applyReadRule(col.viewRule)
        col.createRule = applyWriteRule(col.createRule)
        col.updateRule = applyWriteRule(col.updateRule)
        if (col.deleteRule === "@request.auth.id != ''") {
          col.deleteRule = applyWriteRule(col.deleteRule)
        }
        app.save(col)
      } catch (err) {
        console.log('Skipping rule update for: ' + item.collection)
      }
    }

    const staffOnlyCollections = [
      'fees',
      'expenses',
      'time_entries',
      'leads',
      'document_templates',
      'process_parties',
      'contracts',
      'suppliers',
      'categories',
      'service_orders',
      'activities',
      'contract_amendments',
      'os_schedules',
    ]

    for (const name of staffOnlyCollections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        const applyStaffRule = (current) => {
          if (current === "@request.auth.id != ''") {
            return staffRule
          }
          return current
        }

        col.listRule = applyStaffRule(col.listRule)
        col.viewRule = applyStaffRule(col.viewRule)
        col.createRule = applyStaffRule(col.createRule)
        col.updateRule = applyStaffRule(col.updateRule)
        if (col.deleteRule === "@request.auth.id != ''") {
          col.deleteRule = applyStaffRule(col.deleteRule)
        }
        app.save(col)
      } catch (err) {
        console.log('Skipping staff restriction for: ' + name)
      }
    }
  },
  (app) => {
    const staffRule =
      "@request.auth.role = 'admin' || @request.auth.role = 'consultor' || @request.auth.role = 'lawyer'"

    const allCollections = [
      'processes',
      'process_movements',
      'process_hearings',
      'process_documents',
      'process_deadlines',
      'invoices',
      'clients',
      'fees',
      'expenses',
      'time_entries',
      'leads',
      'document_templates',
      'process_parties',
      'contracts',
      'suppliers',
      'categories',
      'service_orders',
      'activities',
      'contract_amendments',
      'os_schedules',
    ]

    for (const name of allCollections) {
      try {
        const col = app.findCollectionByNameOrId(name)

        const revertRule = (current) => {
          if (!current) return current
          if (current.includes("|| (@request.auth.role = 'cliente'")) {
            return "@request.auth.id != ''"
          }
          if (current === staffRule) {
            return "@request.auth.id != ''"
          }
          return current
        }

        col.listRule = revertRule(col.listRule)
        col.viewRule = revertRule(col.viewRule)
        col.createRule = revertRule(col.createRule)
        col.updateRule = revertRule(col.updateRule)
        if (
          col.deleteRule === staffRule ||
          (col.deleteRule && col.deleteRule.includes("|| (@request.auth.role = 'cliente'"))
        ) {
          col.deleteRule = revertRule(col.deleteRule)
        }
        app.save(col)
      } catch (err) {
        console.log('Skipping down migration for: ' + name)
      }
    }
  },
)
