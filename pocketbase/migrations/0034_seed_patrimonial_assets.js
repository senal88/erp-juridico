migrate(
  (app) => {
    const assetsCol = app.findCollectionByNameOrId('patrimonial_assets')
    const clientsCol = app.findCollectionByNameOrId('clients')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Garantir que o usuário cliente.teste@exemplo.com esteja associado a um cliente da família para testes no portal
    let testUser = null
    try {
      testUser = app.findAuthRecordByEmail('_pb_users_auth_', 'cliente.teste@exemplo.com')
    } catch (_) {}

    // Pegar o primeiro cliente para vincular ao testUser se estiver sem vínculo
    let primaryClient = null
    try {
      const clients = app.findRecordsByFilter('clients', "status = 'active'", 'created', 1, 0)
      if (clients && clients.length > 0) {
        primaryClient = clients[0]
        if (testUser && !primaryClient.get('user')) {
          primaryClient.set('user', testUser.id)
          primaryClient.set('name', 'Família Moreira & Associados')
          primaryClient.set('cpf_cnpj', '45.123.789/0001-90')
          app.save(primaryClient)
        }
      }
    } catch (e) {
      console.log('Erro ao associar cliente de teste: ' + e)
    }

    if (!primaryClient) {
      primaryClient = new Record(clientsCol)
      primaryClient.set('name', 'Família Moreira & Associados')
      primaryClient.set('email', 'patrimonio@moreira.family')
      primaryClient.set('phone', '(11) 98888-7777')
      primaryClient.set('status', 'active')
      primaryClient.set('cpf_cnpj', '45.123.789/0001-90')
      if (testUser) {
        primaryClient.set('user', testUser.id)
      }
      app.save(primaryClient)
    }

    // Criar um segundo cliente para diversidade de portfólios no escritório
    let secondaryClient = null
    try {
      const clients = app.findRecordsByFilter(
        'clients',
        `id != '${primaryClient.id}'`,
        'created',
        1,
        0,
      )
      if (clients && clients.length > 0) {
        secondaryClient = clients[0]
      }
    } catch (_) {}

    if (!secondaryClient) {
      secondaryClient = primaryClient
    }

    const sampleAssets = [
      {
        name: 'Holding Pura Moradas do Sol Participações S.A.',
        description:
          'Holding familiar controladora das operações agroindustriais e imóveis comerciais.',
        asset_type: 'asset',
        asset_class: 'corporate_stake',
        valuation_value: 48500000,
        valuation_date: '2026-01-15 00:00:00.000Z',
        currency: 'BRL',
        direct_owner: 'Patriarca e Matriarca (50% cada)',
        shared_ownership:
          'Usufruto vitalício com reserva de voto; nua-propriedade doada aos 3 herdeiros com cláusulas de inalienabilidade e incomunicabilidade.',
        holding_structure: 'holding_familiar',
        jurisdiction_type: 'brasil',
        country: 'Brasil',
        encumbrances:
          'Reserva de usufruto vitalício aos instituidores; acordo de acionistas com lock-up até 2030.',
        liquidity: 'iliquido',
        evidence_level: 'E4',
        evidence_notes:
          'Estatuto social consolidado na JUCESP, Laudo de Avaliação Econômico-Financeira por consultoria Big 4 (Data-base Dez/2025).',
        notes:
          'Ativo âncora do planejamento sucessório. Distribuição de dividendos isenta sob a regra de transição.',
        client_id: primaryClient.id,
      },
      {
        name: 'Edifício Corporativo Faria Lima - 3 Lajes Comerciais',
        description: 'Conjuntos 141, 142 e 151 no Edifício Prime Tower, Itaim Bibi, São Paulo.',
        asset_type: 'asset',
        asset_class: 'real_estate',
        valuation_value: 26000000,
        valuation_date: '2025-11-20 00:00:00.000Z',
        currency: 'BRL',
        direct_owner: 'Moradas do Sol Participações S.A.',
        shared_ownership: '100% integralizado na holding patrimonial.',
        holding_structure: 'holding_familiar',
        jurisdiction_type: 'brasil',
        country: 'Brasil',
        encumbrances:
          'Locado para multinacional de tecnologia com contrato atípico built-to-suit até 2032.',
        liquidity: 'baixa',
        evidence_level: 'E3',
        evidence_notes:
          'Matrículas atualizadas do 4º Registro de Imóveis de SP e contrato de locação registrado.',
        notes: 'Fluxo contínuo de locação (yield anual de 8,2%). Não há ônus hipotecário.',
        client_id: primaryClient.id,
      },
      {
        name: 'Portfólio Global Offshore - PIC Solaria Ltd (BVI)',
        description:
          'Private Investment Company constituída nas Ilhas Virgens Britânicas com custódia no Banco Safra Genebra.',
        asset_type: 'asset',
        asset_class: 'financial_investments',
        valuation_value: 3800000,
        valuation_date: '2026-02-28 00:00:00.000Z',
        currency: 'USD',
        direct_owner: 'Solaria Ltd (BVI 100%)',
        shared_ownership: 'Cotas detidas pelo Patriarca e declaradas no IRPF e CBE BACEN.',
        holding_structure: 'offshore_pic',
        jurisdiction_type: 'offshore',
        country: 'Ilhas Virgens Britânicas (BVI) / Suíça',
        encumbrances: 'Nenhum ônus.',
        liquidity: 'alta',
        evidence_level: 'E4',
        evidence_notes:
          'Certificado de Incumbency atualizado, extrato bancário oficial Safra Geneva e declaração de CBE 2026 protocolada.',
        notes: 'Portfólio diversificado em Treasuries americanas de 5 anos e fundos globais UCITS.',
        client_id: primaryClient.id,
      },
      {
        name: 'The Lighthouse Trust - Ilha de Man',
        description:
          'Estrutura de Trust Irrevogável com fins de governança sucessória perpétua e custódia em Zurich.',
        asset_type: 'asset',
        asset_class: 'corporate_stake',
        valuation_value: 5200000,
        valuation_date: '2026-01-10 00:00:00.000Z',
        currency: 'USD',
        direct_owner: 'Apex Trust Company (Isle of Man) Limited as Trustee',
        shared_ownership:
          'Beneficiários: Herdeiros de 2ª e 3ª gerações sob condições de idade mínima e graduação.',
        holding_structure: 'trust',
        jurisdiction_type: 'offshore',
        country: 'Ilha de Man / Suíça',
        encumbrances: 'Regras estritas de distribuição e veto por Protectors.',
        liquidity: 'iliquido',
        evidence_level: 'E3',
        evidence_notes:
          'Deed of Trust original, Carta de Desejos (Letter of Wishes) assinada e relatório anual do Trustee.',
        notes:
          'Planejamento alinhado com o regime da Lei 14.754/2023 de tributação de ativos no exterior.',
        client_id: primaryClient.id,
      },
      {
        name: 'Financiamento Imobiliário Estruturado - Lajes Faria Lima',
        description:
          'Cédula de Crédito Bancário (CCB) com amortização trimestral vinculada aos aluguéis.',
        asset_type: 'liability',
        asset_class: 'other',
        valuation_value: 4200000,
        valuation_date: '2026-02-01 00:00:00.000Z',
        currency: 'BRL',
        direct_owner: 'Moradas do Sol Participações S.A.',
        shared_ownership: 'Aval pessoal dos sócios pessoas físicas.',
        holding_structure: 'holding_familiar',
        jurisdiction_type: 'brasil',
        country: 'Brasil',
        encumbrances: 'Cessão fiduciária de recebíveis de aluguel ao banco credor.',
        liquidity: 'alta',
        evidence_level: 'E4',
        evidence_notes:
          'Instrumento particular de CCB aditado, planilha de amortização emitida pelo Santander.',
        notes: 'Passivo controlado. Taxa CDI + 1,4% a.a. Vencimento final em Novembro/2028.',
        client_id: primaryClient.id,
      },
      {
        name: 'Fazenda Santa Tereza - Pecuária e Grãos (Mato Grosso)',
        description: 'Imóvel rural de 1.850 hectares no município de Sinop/MT.',
        asset_type: 'asset',
        asset_class: 'real_estate',
        valuation_value: 42000000,
        valuation_date: '2025-08-30 00:00:00.000Z',
        currency: 'BRL',
        direct_owner: 'Pessoa Física (Patriarca)',
        shared_ownership: 'Casado sob Comunhão Parcial de Bens pré-aquisição.',
        holding_structure: 'individual',
        jurisdiction_type: 'brasil',
        country: 'Brasil',
        encumbrances: 'Reserva legal de 35% averbada no CAR; sem penhoras judiciais.',
        liquidity: 'baixa',
        evidence_level: 'E2',
        evidence_notes:
          'CCIR, ITR 2025 quitado e laudo agrônomo de avaliação física simplificado (pendente laudo formal NBR 14653).',
        notes:
          'Candidato prioritário para conferência de bens ao capital social da holding familiar.',
        client_id: primaryClient.id,
      },
      {
        name: 'Aeronave Executiva Beechcraft King Air B250',
        description: 'Prefixo PR-MFO, hangarada em Jundiaí/SP, compartilhada em condomínio.',
        asset_type: 'asset',
        asset_class: 'vehicles_tangible',
        valuation_value: 15500000,
        valuation_date: '2025-10-15 00:00:00.000Z',
        currency: 'BRL',
        direct_owner: 'Condomínio Patrimonial Alfa-Moreira',
        shared_ownership: '50% Família Moreira / 50% Família Parceira.',
        holding_structure: 'condominio_patrimonial',
        jurisdiction_type: 'brasil',
        country: 'Brasil',
        encumbrances: 'Alienação fiduciária em garantia no Bradesco Financiamentos.',
        liquidity: 'media',
        evidence_level: 'E3',
        evidence_notes:
          'Certificado de Matrícula da ANAC (RAB), apólice de seguro casco e logbook de manutenção em dia.',
        notes: 'Custos fixos de hangaragem e tripulação rateados 50/50 mensalmente.',
        client_id: primaryClient.id,
      },
      {
        name: 'Participação Declarada em Startup AgroTech (Série A)',
        description:
          'Mútuo conversível com expectativa de equity de 8% em empresa de biotecnologia.',
        asset_type: 'asset',
        asset_class: 'corporate_stake',
        valuation_value: 2500000,
        valuation_date: '2024-12-20 00:00:00.000Z',
        currency: 'BRL',
        direct_owner: 'Herdeiro 1 (Pessoa Física)',
        shared_ownership: 'Individual.',
        holding_structure: 'individual',
        jurisdiction_type: 'brasil',
        country: 'Brasil',
        encumbrances: 'Nenhum.',
        liquidity: 'iliquido',
        evidence_level: 'E1',
        evidence_notes: 'Apenas minuta não assinada e memorando de entendimento preliminar.',
        notes:
          'ALERTA MFO: Nível E1 insuficiente para reorganização sucessória ou cálculo de legítima. Requer instrumento assinado e cap table auditado.',
        client_id: primaryClient.id,
      },
      {
        name: 'Obras de Arte e Coleção de Relógios Antigos',
        description:
          'Conjunto de pinturas modernistas brasileiras (Di Cavalcanti, Volpi) e cronômetros de coleção.',
        asset_type: 'asset',
        asset_class: 'vehicles_tangible',
        valuation_value: 4000000,
        valuation_date: '2026-01-01 00:00:00.000Z',
        currency: 'BRL',
        direct_owner: 'Pessoa Física',
        shared_ownership: 'Em posse na residência familiar.',
        holding_structure: 'individual',
        jurisdiction_type: 'brasil',
        country: 'Brasil',
        encumbrances: 'Sem registro ou apólice de seguro específica.',
        liquidity: 'iliquido',
        evidence_level: 'E0',
        evidence_notes:
          'Ativo apenas declarado informalmente pela família em reunião exploratória. Não há laudo de autenticidade, seguro ou catálogo.',
        notes:
          'ALERTA MFO: Classificado em E0 (declarado sem prova). Requer catálogo pericial e seguro antes de qualquer alocação patrimonial.',
        client_id: primaryClient.id,
      },
      {
        name: 'Apartamento Residencial Quinta da Marinha (Portugal)',
        description:
          'Imóvel de alto padrão em Cascais, Portugal, para residência de verão e usufruto familiar.',
        asset_type: 'asset',
        asset_class: 'real_estate',
        valuation_value: 1750000,
        valuation_date: '2025-12-05 00:00:00.000Z',
        currency: 'EUR',
        direct_owner: 'Holding Imobiliária Unipessoal Lda (Portugal)',
        shared_ownership: 'Quotas 100% de titularidade do casal.',
        holding_structure: 'holding_operacional',
        jurisdiction_type: 'offshore',
        country: 'Portugal',
        encumbrances: 'Livre de hipoteca.',
        liquidity: 'media',
        evidence_level: 'E3',
        evidence_notes: 'Certidão Permanente do Registo Predial de Cascais e IMI quitado.',
        notes: 'Elegível ao regime fiscal favorável para residentes não habituais / D8.',
        client_id: secondaryClient.id,
      },
    ]

    for (const item of sampleAssets) {
      try {
        app.findFirstRecordByData('patrimonial_assets', 'name', item.name)
        // já existe
      } catch (_) {
        const record = new Record(assetsCol)
        record.set('name', item.name)
        record.set('description', item.description)
        record.set('asset_type', item.asset_type)
        record.set('asset_class', item.asset_class)
        record.set('valuation_value', item.valuation_value)
        record.set('valuation_date', item.valuation_date)
        record.set('currency', item.currency)
        record.set('direct_owner', item.direct_owner)
        record.set('shared_ownership', item.shared_ownership)
        record.set('holding_structure', item.holding_structure)
        record.set('jurisdiction_type', item.jurisdiction_type)
        record.set('country', item.country)
        record.set('encumbrances', item.encumbrances)
        record.set('liquidity', item.liquidity)
        record.set('evidence_level', item.evidence_level)
        record.set(
          'valid_for_material_decision',
          item.evidence_level === 'E2' ||
            item.evidence_level === 'E3' ||
            item.evidence_level === 'E4',
        )
        record.set('evidence_notes', item.evidence_notes)
        record.set('notes', item.notes)
        record.set('client_id', item.client_id)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('patrimonial_assets', "name != ''", 'created', 100, 0)
      for (const rec of records) {
        app.delete(rec)
      }
    } catch (_) {}
  },
)
