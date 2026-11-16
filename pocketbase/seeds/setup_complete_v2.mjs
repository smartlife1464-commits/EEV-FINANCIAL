import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
pb.autoCancellation(false);

async function setup() {
  console.log('🚀 [EEV-V2] Déploiement de la structure complète V2 de PocketBase...');

  await pb.collection('_superusers').authWithPassword('admin@espritvie.org', 'AdminEspritVie2026!');
  console.log('✅ Connecté en Superuser.');

  // Récupérer le mapping des collections existantes par nom
  const allCols = await pb.collections.getFullList();
  const colIdMap = {};
  for (const c of allCols) {
    colIdMap[c.name] = c.id;
  }

  const defaultIdField = {
    autogeneratePattern: '[a-z0-9]{15}',
    hidden: false,
    id: 'text3208210256',
    max: 15,
    min: 15,
    name: 'id',
    pattern: '^[a-z0-9]+$',
    presentable: false,
    primaryKey: true,
    required: true,
    system: true,
    type: 'text'
  };

  // Helper pour créer ou mettre à jour une collection avec ses champs
  async function ensureCollection(name, type, fieldsBuilder, rules = {}) {
    let col;
    // Résoudre les collectionId si relation
    const rawFields = typeof fieldsBuilder === 'function' ? fieldsBuilder(colIdMap) : fieldsBuilder;
    const fields = rawFields.map((f) => {
      if (f.type === 'relation' && f.targetCollection) {
        return {
          ...f,
          collectionId: colIdMap[f.targetCollection],
        };
      }
      return f;
    });

    try {
      col = await pb.collections.getOne(name);
      console.log(`ℹ️ Collection existante: ${name}`);
      const sysId = col.fields.find(f => f.name === 'id') || defaultIdField;
      sysId.autogeneratePattern = '[a-z0-9]{15}';
      const mergedFields = [
        sysId,
        ...fields.filter((f) => f.name !== 'id'),
      ];
      col.fields = mergedFields;
      if (rules.listRule !== undefined) col.listRule = rules.listRule;
      if (rules.viewRule !== undefined) col.viewRule = rules.viewRule;
      if (rules.createRule !== undefined) col.createRule = rules.createRule;
      if (rules.updateRule !== undefined) col.updateRule = rules.updateRule;
      if (rules.deleteRule !== undefined) col.deleteRule = rules.deleteRule;
      await pb.collections.update(col.id, col);
      console.log(`🔄 Collection mise à jour: ${name}`);
    } catch {
      col = await pb.collections.create({
        name,
        type: type || 'base',
        fields: [
          defaultIdField,
          ...fields.filter((f) => f.name !== 'id'),
        ],
        ...rules,
      });
      console.log(`➕ Collection créée: ${name}`);
    }
    colIdMap[name] = col.id;
    return col;
  }

  // 1. SERVICE_TYPES (Les 7 types officiels)
  await ensureCollection('service_types', 'base', [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'is_active', type: 'bool' },
    { name: 'display_order', type: 'number', required: true },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: null,
  });

  // 2. FUND_ACCOUNTS
  await ensureCollection('fund_accounts', 'base', [
    { name: 'code', type: 'text', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'current_balance', type: 'number', required: true },
    { name: 'is_restricted', type: 'bool' },
    { name: 'is_active', type: 'bool' },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    deleteRule: null,
  });

  // 3. FIXED_EXPENSES (Charges fixes récurrentes)
  await ensureCollection('fixed_expenses', 'base', (m) => [
    { name: 'name', type: 'text', required: true },
    { name: 'category', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'amount', type: 'number', required: true },
    { name: 'currency', type: 'text', required: true },
    { name: 'frequency', type: 'text', required: true },
    { name: 'due_day', type: 'number' },
    { name: 'start_date', type: 'text', required: true },
    { name: 'end_date', type: 'text' },
    { name: 'fund_account', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1, required: true },
    { name: 'beneficiary', type: 'text', required: true },
    { name: 'responsible_user', type: 'relation', targetCollection: 'users', maxSelect: 1 },
    { name: 'payment_method', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'notes', type: 'text' },
    { name: 'created_by', type: 'relation', targetCollection: 'users', maxSelect: 1 },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    deleteRule: "@request.auth.role = 'admin'",
  });

  // 4. FIXED_EXPENSE_OCCURRENCES (Échéances générées)
  await ensureCollection('fixed_expense_occurrences', 'base', (m) => [
    { name: 'fixed_expense', type: 'relation', targetCollection: 'fixed_expenses', maxSelect: 1, required: true },
    { name: 'due_date', type: 'text', required: true },
    { name: 'expected_amount', type: 'number', required: true },
    { name: 'fund_account', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1, required: true },
    { name: 'status', type: 'text', required: true },
    { name: 'reserved_amount', type: 'number' },
    { name: 'paid_amount', type: 'number' },
    { name: 'coverage_status', type: 'text' },
    { name: 'generated_at', type: 'text' },
    { name: 'approved_by', type: 'relation', targetCollection: 'users', maxSelect: 1 },
    { name: 'approved_at', type: 'text' },
    { name: 'paid_at', type: 'text' },
    { name: 'payment_transaction', type: 'text' },
    { name: 'notes', type: 'text' },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    deleteRule: null,
  });

  // 5. EXPENSE_BUDGETS (Plafonds / Budgets dépenses variables)
  await ensureCollection('expense_budgets', 'base', (m) => [
    { name: 'category', type: 'text', required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'period_type', type: 'text', required: true },
    { name: 'period_start', type: 'text', required: true },
    { name: 'period_end', type: 'text', required: true },
    { name: 'fund_account', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1 },
    { name: 'alert_threshold', type: 'number' },
    { name: 'status', type: 'text', required: true },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    deleteRule: null,
  });

  // 6. EXPENSE_CATEGORIES
  await ensureCollection('expense_categories', 'base', [
    { name: 'code', type: 'text', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'type', type: 'text' },
    { name: 'description', type: 'text' },
    { name: 'is_active', type: 'bool' },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: null,
  });

  // 7. EXPENSES (Fixes et Variables)
  await ensureCollection('expenses', 'base', (m) => [
    { name: 'expense_number', type: 'text', required: true },
    { name: 'expense_type', type: 'text' },
    { name: 'category', type: 'relation', targetCollection: 'expense_categories', maxSelect: 1 },
    { name: 'category_name', type: 'text' },
    { name: 'fund_account', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1, required: true },
    { name: 'fixed_expense', type: 'relation', targetCollection: 'fixed_expenses', maxSelect: 1 },
    { name: 'fixed_occurrence', type: 'relation', targetCollection: 'fixed_expense_occurrences', maxSelect: 1 },
    { name: 'amount', type: 'number', required: true },
    { name: 'beneficiary', type: 'text', required: true },
    { name: 'purpose', type: 'text', required: true },
    { name: 'expense_date', type: 'text' },
    { name: 'receipt_url', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'requested_by', type: 'relation', targetCollection: 'users', maxSelect: 1, required: true },
    { name: 'approved_by', type: 'relation', targetCollection: 'users', maxSelect: 1 },
    { name: 'approved_at', type: 'text' },
    { name: 'rejection_reason', type: 'text' },
    { name: 'paid_at', type: 'text' },
    { name: 'paid_by', type: 'relation', targetCollection: 'users', maxSelect: 1 },
    { name: 'payment_method', type: 'text' },
    { name: 'payment_reference', type: 'text' },
    { name: 'notes', type: 'text' },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    deleteRule: null,
  });

  // 8. SERVICES (Cultes programmés)
  await ensureCollection('services', 'base', (m) => [
    { name: 'name', type: 'text', required: true },
    { name: 'service_type', type: 'text', required: true },
    { name: 'service_type_ref', type: 'relation', targetCollection: 'service_types', maxSelect: 1 },
    { name: 'date', type: 'text', required: true },
    { name: 'start_time', type: 'text', required: true },
    { name: 'end_time', type: 'text', required: true },
    { name: 'status', type: 'text', required: true },
    { name: 'description', type: 'text' },
    { name: 'protocol_leader', type: 'relation', targetCollection: 'users', maxSelect: 1 },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,protocol_lead,lead_pastor'",
    updateRule: "@request.auth.role ?= 'admin,protocol_lead,lead_pastor'",
    deleteRule: "@request.auth.role = 'admin'",
  });

  // 9. ATTENDANCE_SHEETS
  await ensureCollection('attendance_sheets', 'base', (m) => [
    { name: 'service', type: 'relation', targetCollection: 'services', maxSelect: 1 },
    { name: 'service_type', type: 'relation', targetCollection: 'service_types', maxSelect: 1 },
    { name: 'service_type_slug', type: 'text' },
    { name: 'service_date', type: 'text', required: true },
    { name: 'start_time', type: 'text' },
    { name: 'end_time', type: 'text' },
    { name: 'men_count', type: 'number', required: true },
    { name: 'women_count', type: 'number', required: true },
    { name: 'youth_count', type: 'number', required: true },
    { name: 'children_count', type: 'number', required: true },
    { name: 'total_attendance', type: 'number', required: true },
    { name: 'new_visitors_count', type: 'number', required: true },
    { name: 'salvations_count', type: 'number' },
    { name: 'notes', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'responsible_user', type: 'relation', targetCollection: 'users', maxSelect: 1 },
    { name: 'submitted_by', type: 'relation', targetCollection: 'users', maxSelect: 1, required: true },
    { name: 'validated_by', type: 'relation', targetCollection: 'users', maxSelect: 1 },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'protocol_agent,protocol_lead,admin,lead_pastor'",
    updateRule: "@request.auth.role ?= 'protocol_lead,admin,lead_pastor'",
    deleteRule: null,
  });

  // 10. FINANCIAL_CATEGORIES
  await ensureCollection('financial_categories', 'base', (m) => [
    { name: 'code', type: 'text', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'allocation_rule', type: 'text', required: true },
    { name: 'target_fund', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1 },
    { name: 'description', type: 'text' },
    { name: 'is_active', type: 'bool' },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: null,
  });

  // 11. FINANCIAL_ENTRIES
  await ensureCollection('financial_entries', 'base', (m) => [
    { name: 'entry_number', type: 'text', required: true },
    { name: 'service', type: 'relation', targetCollection: 'services', maxSelect: 1 },
    { name: 'category', type: 'relation', targetCollection: 'financial_categories', maxSelect: 1, required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'payment_method', type: 'text', required: true },
    { name: 'reference', type: 'text' },
    { name: 'donor_name', type: 'text' },
    { name: 'notes', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'collected_at', type: 'text', required: true },
    { name: 'created_by', type: 'relation', targetCollection: 'users', maxSelect: 1, required: true },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor'",
    deleteRule: null,
  });

  // 12. FUND_ALLOCATIONS
  await ensureCollection('fund_allocations', 'base', (m) => [
    { name: 'financial_entry', type: 'relation', targetCollection: 'financial_entries', maxSelect: 1, required: true },
    { name: 'fund_account', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1, required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'percentage', type: 'number', required: true },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: null,
    deleteRule: null,
  });

  // 13. INTERNAL_TRANSFERS
  await ensureCollection('internal_transfers', 'base', (m) => [
    { name: 'transfer_number', type: 'text', required: true },
    { name: 'source_fund', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1, required: true },
    { name: 'destination_fund', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1, required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'reason', type: 'text', required: true },
    { name: 'authorized_by', type: 'relation', targetCollection: 'users', maxSelect: 1, required: true },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    updateRule: null,
    deleteRule: null,
  });

  // 14. FUND_TRANSACTIONS
  await ensureCollection('fund_transactions', 'base', (m) => [
    { name: 'transaction_number', type: 'text', required: true },
    { name: 'fund_account', type: 'relation', targetCollection: 'fund_accounts', maxSelect: 1, required: true },
    { name: 'type', type: 'text', required: true },
    { name: 'direction', type: 'text', required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'balance_after', type: 'number', required: true },
    { name: 'related_entry', type: 'relation', targetCollection: 'financial_entries', maxSelect: 1 },
    { name: 'related_expense', type: 'relation', targetCollection: 'expenses', maxSelect: 1 },
    { name: 'related_transfer', type: 'relation', targetCollection: 'internal_transfers', maxSelect: 1 },
    { name: 'description', type: 'text', required: true },
    { name: 'created_by', type: 'relation', targetCollection: 'users', maxSelect: 1, required: true },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: null,
    deleteRule: null,
  });

  // 15. CASH_CLOSINGS
  await ensureCollection('cash_closings', 'base', (m) => [
    { name: 'pv_number', type: 'text', required: true },
    { name: 'closing_date', type: 'text', required: true },
    { name: 'theoretical_balance', type: 'number', required: true },
    { name: 'physical_cash_total', type: 'number', required: true },
    { name: 'electronic_total', type: 'number', required: true },
    { name: 'checks_total', type: 'number', required: true },
    { name: 'total_counted', type: 'number', required: true },
    { name: 'discrepancy', type: 'number', required: true },
    { name: 'status', type: 'text', required: true },
    { name: 'breakdown', type: 'json' },
    { name: 'notes', type: 'text' },
    { name: 'cashier', type: 'relation', targetCollection: 'users', maxSelect: 1, required: true },
    { name: 'auditor', type: 'relation', targetCollection: 'users', maxSelect: 1 },
    { name: 'senior_pastor', type: 'relation', targetCollection: 'users', maxSelect: 1 },
  ], {
    listRule: '',
    viewRule: '',
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor'",
    deleteRule: null,
  });

  // 16. PEUPLEMENT DES 7 TYPES DE SERVICES OFFICIELS
  console.log('🌱 Peuple les 7 types officiels de services...');
  const officialServices = [
    { name: 'Culte de Mardi', slug: 'tuesday_service', description: 'Culte d’enseignement biblique et de prière du mardi', display_order: 1 },
    { name: 'Culte de Jeudi', slug: 'thursday_service', description: 'Culte d’intercession, délivrance et témoignages du jeudi', display_order: 2 },
    { name: '1er Service Dimanche', slug: 'sunday_service_1', description: 'Premier culte dominical d’adoration et louange', display_order: 3 },
    { name: '2ème Service Dimanche', slug: 'sunday_service_2', description: 'Deuxième culte dominical de célébration', display_order: 4 },
    { name: 'Camp Missionnaire', slug: 'mission_camp', description: 'Rassemblement et retraite missionnaire', display_order: 5 },
    { name: 'Camp des Bergers', slug: 'shepherds_camp', description: 'Retraite de formation spirituelle et leadership pastoral', display_order: 6 },
    { name: 'Programmes Spéciaux', slug: 'special_programs', description: 'Veillées, conférences, croisades et événements exceptionnels', display_order: 7 },
  ];

  const serviceTypeMap = {};
  for (const s of officialServices) {
    try {
      const rec = await pb.collection('service_types').getFirstListItem(`slug = "${s.slug}"`);
      serviceTypeMap[s.slug] = rec.id;
      await pb.collection('service_types').update(rec.id, { ...s, is_active: true });
    } catch {
      const rec = await pb.collection('service_types').create({ ...s, is_active: true });
      serviceTypeMap[s.slug] = rec.id;
      console.log(`➕ Type de service créé: ${s.name}`);
    }
  }

  // 17. PEUPLEMENT DES COMPARTIMENTS ANALYTIQUES
  console.log('🌱 Peuple les compartiments analytiques...');
  const funds = [
    { code: 'GENERAL', name: 'Fonds Général (80% Dîmes/Offrandes)', current_balance: 8500000, is_restricted: false, is_active: true, description: 'Seul compartiment finançant les charges courantes de fonctionnement' },
    { code: 'TITHE_OF_TITHES', name: 'Dîme des Dîmes (10%)', current_balance: 1450000, is_restricted: true, is_active: true, description: 'Prélèvement obligatoire réservé au sacerdoce pastoral' },
    { code: 'WELFARE_AID', name: 'Aide Sociale & Secours (10%)', current_balance: 1300000, is_restricted: true, is_active: true, description: 'Prélèvement obligatoire réservé aux veuves, orphelins et secours d’urgence' },
    { code: 'BUILDING', name: 'Construction Auditorium', current_balance: 2800000, is_restricted: true, is_active: true, description: 'Fonds affecté à 100% pour la construction du grand temple (0% de prélèvement)' },
    { code: 'FRIENDS_OF_JESUS', name: 'Amis de Jésus', current_balance: 700000, is_restricted: true, is_active: true, description: 'Fonds affecté à 100% pour les partenaires missionnaires' },
  ];

  const fundMap = {};
  for (const f of funds) {
    try {
      const rec = await pb.collection('fund_accounts').getFirstListItem(`code = "${f.code}"`);
      fundMap[f.code] = rec.id;
      await pb.collection('fund_accounts').update(rec.id, { current_balance: f.current_balance, is_active: true });
    } catch {
      const rec = await pb.collection('fund_accounts').create(f);
      fundMap[f.code] = rec.id;
      console.log(`➕ Compartiment créé: ${f.name}`);
    }
  }

  // 18. PEUPLEMENT DES CATÉGORIES DE DÉPENSES
  console.log('🌱 Peuple les catégories de dépenses...');
  const expCategories = [
    // Charges Fixes
    { code: 'rent', name: 'Loyer', type: 'fixed', is_active: true, description: 'Location mensuelle du bâtiment principal' },
    { code: 'water', name: 'Eau', type: 'fixed', is_active: true, description: 'Factures régulières d’eau Sonel / CDE' },
    { code: 'electricity', name: 'Électricité', type: 'fixed', is_active: true, description: 'Factures régulières électricité ENEO' },
    { code: 'internet', name: 'Internet', type: 'fixed', is_active: true, description: 'Fibre optique et abonnements télécoms' },
    { code: 'subscriptions', name: 'Abonnements', type: 'fixed', is_active: true, description: 'Licences logicielles, streaming et hébergement' },
    { code: 'maintenance_recurring', name: 'Entretien récurrent', type: 'fixed', is_active: true, description: 'Contrats de nettoyage et gardiennage' },
    { code: 'other_fixed', name: 'Autres charges régulières', type: 'fixed', is_active: true, description: 'Charges administratives périodiques' },
    // Dépenses Variables
    { code: 'transport', name: 'Transport', type: 'variable', is_active: true, description: 'Carburant, taxis, déplacements' },
    { code: 'nutrition', name: 'Nutrition', type: 'variable', is_active: true, description: 'Restauration, collations ouvriers' },
    { code: 'aid', name: 'Aide', type: 'variable', is_active: true, description: 'Aide et secours social d’urgence' },
    { code: 'logistics', name: 'Logistique', type: 'variable', is_active: true, description: 'Chaises, sonorisation ponctuelle' },
    { code: 'health', name: 'Santé', type: 'variable', is_active: true, description: 'Frais médicaux et premiers secours' },
    { code: 'communication', name: 'Communication', type: 'variable', is_active: true, description: 'Médias, affiches, impressions' },
    { code: 'equipment', name: 'Matériel', type: 'variable', is_active: true, description: 'Câbles, micros, matériel sonore' },
    { code: 'exceptional_maintenance', name: 'Entretien exceptionnel', type: 'variable', is_active: true, description: 'Réparations imprévues' },
    { code: 'evangelism', name: 'Évangélisation', type: 'variable', is_active: true, description: 'Missions et sorties évangélisation' },
    { code: 'mission', name: 'Mission', type: 'variable', is_active: true, description: 'Missions pastorales et provinciales' },
    { code: 'hospitality', name: 'Hébergement', type: 'variable', is_active: true, description: 'Hébergement des orateurs et ministres' },
    { code: 'training', name: 'Formation', type: 'variable', is_active: true, description: 'Séminaires et cours de formation' },
    { code: 'events', name: 'Événements', type: 'variable', is_active: true, description: 'Conventions, conférences et concerts' },
    { code: 'other_variable', name: 'Autres dépenses', type: 'variable', is_active: true, description: 'Dépenses occasionnelles diverses' },
  ];

  const catMap = {};
  for (const ec of expCategories) {
    try {
      const rec = await pb.collection('expense_categories').getFirstListItem(`code = "${ec.code}"`);
      catMap[ec.code] = rec.id;
      await pb.collection('expense_categories').update(rec.id, ec);
    } catch {
      const rec = await pb.collection('expense_categories').create(ec);
      catMap[ec.code] = rec.id;
      console.log(`➕ Catégorie créée: ${ec.name}`);
    }
  }

  // 19. CHARGES FIXES DE BASE
  console.log('🌱 Peuple les charges fixes exemplaires...');
  const adminUser = await pb.collection('users').getFirstListItem('email = "admin@espritvie.org"');

  const defaultFixedExpenses = [
    {
      name: 'Loyer',
      category: 'Loyer',
      description: 'Loyer mensuel du temple principal',
      amount: 150000,
      currency: 'XAF',
      frequency: 'monthly',
      due_day: 5,
      start_date: '2026-01-01',
      fund_account: fundMap['GENERAL'],
      beneficiary: 'Bailleur SCI Temple',
      payment_method: 'bank_transfer',
      status: 'active',
      notes: 'Payable au plus tard le 5 de chaque mois.',
      created_by: adminUser.id,
    },
    {
      name: 'Eau',
      category: 'Eau',
      description: 'Consommation d’eau courante du sanctuaire',
      amount: 15000,
      currency: 'XAF',
      frequency: 'monthly',
      due_day: 10,
      start_date: '2026-01-01',
      fund_account: fundMap['GENERAL'],
      beneficiary: 'Camwater',
      payment_method: 'cash',
      status: 'active',
      notes: 'Échéance le 10 de chaque mois.',
      created_by: adminUser.id,
    },
    {
      name: 'Électricité',
      category: 'Électricité',
      description: 'Facture électricité moyenne du temple',
      amount: 35000,
      currency: 'XAF',
      frequency: 'monthly',
      due_day: 15,
      start_date: '2026-01-01',
      fund_account: fundMap['GENERAL'],
      beneficiary: 'ENEO Cameroun',
      payment_method: 'mobile_money',
      status: 'active',
      notes: 'Paiement via compte Mobile Money.',
      created_by: adminUser.id,
    },
    {
      name: 'Internet',
      category: 'Internet',
      description: 'Liaison fibre optique 50 Mbps pour streaming',
      amount: 25000,
      currency: 'XAF',
      frequency: 'monthly',
      due_day: 20,
      start_date: '2026-01-01',
      fund_account: fundMap['GENERAL'],
      beneficiary: 'Fournisseur Telecom',
      payment_method: 'bank_transfer',
      status: 'active',
      notes: 'Essentiel pour la diffusion en direct.',
      created_by: adminUser.id,
    },
  ];

  for (const fe of defaultFixedExpenses) {
    try {
      const rec = await pb.collection('fixed_expenses').getFirstListItem(`name = "${fe.name}"`);
      await pb.collection('fixed_expenses').update(rec.id, fe);
    } catch {
      await pb.collection('fixed_expenses').create(fe);
      console.log(`➕ Charge fixe créée: ${fe.name} (${fe.amount} FCFA)`);
    }
  }

  // 20. BUDGETS DÉPENSES VARIABLES
  console.log('🌱 Peuple les plafonds budgétaires...');
  const defaultBudgets = [
    { category: 'Transport', amount: 100000, period_type: 'monthly', period_start: '2026-11-01', period_end: '2026-11-30', fund_account: fundMap['GENERAL'], alert_threshold: 80, status: 'active' },
    { category: 'Nutrition', amount: 75000, period_type: 'monthly', period_start: '2026-11-01', period_end: '2026-11-30', fund_account: fundMap['GENERAL'], alert_threshold: 80, status: 'active' },
    { category: 'Logistique', amount: 150000, period_type: 'monthly', period_start: '2026-11-01', period_end: '2026-11-30', fund_account: fundMap['GENERAL'], alert_threshold: 80, status: 'active' },
    { category: 'Aide', amount: 50000, period_type: 'monthly', period_start: '2026-11-01', period_end: '2026-11-30', fund_account: fundMap['WELFARE_AID'], alert_threshold: 80, status: 'active' },
  ];

  for (const b of defaultBudgets) {
    try {
      const rec = await pb.collection('expense_budgets').getFirstListItem(`category = "${b.category}" && period_start = "${b.period_start}"`);
      await pb.collection('expense_budgets').update(rec.id, b);
    } catch {
      await pb.collection('expense_budgets').create(b);
      console.log(`➕ Budget créé: ${b.category} (${b.amount} FCFA)`);
    }
  }

  console.log('🎉 [EEV-V2] Déploiement V2 et initialisation terminés avec succès !');
}

setup().catch(console.error);
