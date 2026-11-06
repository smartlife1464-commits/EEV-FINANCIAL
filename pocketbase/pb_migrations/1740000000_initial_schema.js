/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. ROLES COLLECTION
  const roles = new Collection({
    name: "roles",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "code", type: "text", required: true, unique: true },
      { name: "description", type: "text" },
      { name: "permissions", type: "json" },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: null,
  });
  app.save(roles);

  // 2. DEPARTMENTS COLLECTION
  const departments = new Collection({
    name: "departments",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "code", type: "text", required: true, unique: true },
      { name: "description", type: "text" },
      { name: "leader", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1 },
      { name: "is_active", type: "bool", required: true },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: null,
  });
  app.save(departments);

  // 3. Update users auth collection fields
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  users.fields.add(new TextField({ name: "role", required: true }));
  users.fields.add(new TextField({ name: "phone" }));
  users.fields.add(new RelationField({
    name: "department",
    collectionId: departments.id,
    maxSelect: 1,
  }));
  users.fields.add(new BoolField({ name: "is_active", required: true }));
  app.save(users);

  // 4. SERVICES COLLECTION
  const services = new Collection({
    name: "services",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "service_type", type: "text", required: true },
      { name: "date", type: "date", required: true },
      { name: "start_time", type: "text", required: true },
      { name: "end_time", type: "text", required: true },
      { name: "status", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "protocol_leader", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1 },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role ?= 'admin,protocol_lead,lead_pastor'",
    updateRule: "@request.auth.role ?= 'admin,protocol_lead,lead_pastor'",
    deleteRule: "@request.auth.role = 'admin'",
  });
  app.save(services);

  // 5. ATTENDANCE SHEETS COLLECTION
  const attendanceSheets = new Collection({
    name: "attendance_sheets",
    type: "base",
    schema: [
      { name: "service", type: "relation", collectionId: services.id, maxSelect: 1, required: true, unique: true },
      { name: "men_count", type: "number", required: true },
      { name: "women_count", type: "number", required: true },
      { name: "youth_count", type: "number", required: true },
      { name: "children_count", type: "number", required: true },
      { name: "total_attendance", type: "number", required: true },
      { name: "new_visitors_count", type: "number", required: true },
      { name: "salvations_count", type: "number" },
      { name: "notes", type: "text" },
      { name: "status", type: "text", required: true },
      { name: "submitted_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1, required: true },
      { name: "validated_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1 },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role ?= 'protocol_agent,protocol_lead,admin,lead_pastor'",
    updateRule: "@request.auth.role ?= 'protocol_lead,admin,lead_pastor'",
    deleteRule: null,
  });
  app.save(attendanceSheets);

  // 6. FUND ACCOUNTS COLLECTION (Compartiments analytiques de la caisse consolidée)
  const fundAccounts = new Collection({
    name: "fund_accounts",
    type: "base",
    schema: [
      { name: "code", type: "text", required: true, unique: true },
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "current_balance", type: "number", required: true },
      { name: "is_restricted", type: "bool", required: true },
      { name: "is_active", type: "bool", required: true },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor'",
    deleteRule: null,
  });
  app.save(fundAccounts);

  // 7. FINANCIAL CATEGORIES COLLECTION
  const financialCategories = new Collection({
    name: "financial_categories",
    type: "base",
    schema: [
      { name: "code", type: "text", required: true, unique: true },
      { name: "name", type: "text", required: true },
      { name: "allocation_rule", type: "text", required: true },
      { name: "target_fund", type: "relation", collectionId: fundAccounts.id, maxSelect: 1 },
      { name: "description", type: "text" },
      { name: "is_active", type: "bool", required: true },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: null,
  });
  app.save(financialCategories);

  // 8. FINANCIAL ENTRIES COLLECTION (Recettes brutes)
  const financialEntries = new Collection({
    name: "financial_entries",
    type: "base",
    schema: [
      { name: "entry_number", type: "text", required: true, unique: true },
      { name: "service", type: "relation", collectionId: services.id, maxSelect: 1 },
      { name: "category", type: "relation", collectionId: financialCategories.id, maxSelect: 1, required: true },
      { name: "amount", type: "number", required: true },
      { name: "payment_method", type: "text", required: true },
      { name: "reference", type: "text" },
      { name: "donor_name", type: "text" },
      { name: "notes", type: "text" },
      { name: "status", type: "text", required: true },
      { name: "collected_at", type: "date", required: true },
      { name: "created_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1, required: true },
    ],
    listRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    viewRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor'",
    deleteRule: null, // Aucune suppression directe
  });
  app.save(financialEntries);

  // 9. FUND ALLOCATIONS (Lignes de ventilation des recettes)
  const fundAllocations = new Collection({
    name: "fund_allocations",
    type: "base",
    schema: [
      { name: "financial_entry", type: "relation", collectionId: financialEntries.id, maxSelect: 1, required: true },
      { name: "fund_account", type: "relation", collectionId: fundAccounts.id, maxSelect: 1, required: true },
      { name: "amount", type: "number", required: true },
      { name: "percentage", type: "number", required: true },
    ],
    listRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    viewRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: null,
    deleteRule: null,
  });
  app.save(fundAllocations);

  // 10. EXPENSE CATEGORIES
  const expenseCategories = new Collection({
    name: "expense_categories",
    type: "base",
    schema: [
      { name: "code", type: "text", required: true, unique: true },
      { name: "name", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "is_active", type: "bool", required: true },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: null,
  });
  app.save(expenseCategories);

  // 11. EXPENSES (Dépenses à 3 étapes : Enregistrée -> Approuvée -> Payée)
  const expenses = new Collection({
    name: "expenses",
    type: "base",
    schema: [
      { name: "expense_number", type: "text", required: true, unique: true },
      { name: "category", type: "relation", collectionId: expenseCategories.id, maxSelect: 1, required: true },
      { name: "fund_account", type: "relation", collectionId: fundAccounts.id, maxSelect: 1, required: true },
      { name: "amount", type: "number", required: true },
      { name: "beneficiary", type: "text", required: true },
      { name: "purpose", type: "text", required: true },
      { name: "receipt", type: "file" },
      { name: "status", type: "text", required: true },
      { name: "requested_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1, required: true },
      { name: "approved_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1 },
      { name: "approved_at", type: "date" },
      { name: "rejection_reason", type: "text" },
      { name: "paid_at", type: "date" },
      { name: "paid_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1 },
      { name: "payment_method", type: "text" },
      { name: "payment_reference", type: "text" },
    ],
    listRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    viewRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    deleteRule: null,
  });
  app.save(expenses);

  // 12. INTERNAL TRANSFERS
  const internalTransfers = new Collection({
    name: "internal_transfers",
    type: "base",
    schema: [
      { name: "transfer_number", type: "text", required: true, unique: true },
      { name: "source_fund", type: "relation", collectionId: fundAccounts.id, maxSelect: 1, required: true },
      { name: "destination_fund", type: "relation", collectionId: fundAccounts.id, maxSelect: 1, required: true },
      { name: "amount", type: "number", required: true },
      { name: "reason", type: "text", required: true },
      { name: "authorized_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1, required: true },
    ],
    listRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,auditor'",
    viewRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,auditor'",
    createRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    updateRule: null,
    deleteRule: null,
  });
  app.save(internalTransfers);

  // 13. FUND TRANSACTIONS (Grand livre analytique immuable)
  const fundTransactions = new Collection({
    name: "fund_transactions",
    type: "base",
    schema: [
      { name: "transaction_number", type: "text", required: true, unique: true },
      { name: "fund_account", type: "relation", collectionId: fundAccounts.id, maxSelect: 1, required: true },
      { name: "type", type: "text", required: true },
      { name: "direction", type: "text", required: true }, // 'credit' | 'debit'
      { name: "amount", type: "number", required: true },
      { name: "balance_after", type: "number", required: true },
      { name: "related_entry", type: "relation", collectionId: financialEntries.id, maxSelect: 1 },
      { name: "related_expense", type: "relation", collectionId: expenses.id, maxSelect: 1 },
      { name: "related_transfer", type: "relation", collectionId: internalTransfers.id, maxSelect: 1 },
      { name: "description", type: "text", required: true },
      { name: "created_by", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1, required: true },
    ],
    listRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,auditor'",
    viewRule: "@request.auth.role ?= 'admin,lead_pastor,finance_lead,auditor'",
    createRule: "@request.auth.role ?= 'admin,finance_lead,cashier'",
    updateRule: null,
    deleteRule: null, // Immuable
  });
  app.save(fundTransactions);

  // 14. AUDIT LOGS (Piste d'audit de sécurité)
  const auditLogs = new Collection({
    name: "audit_logs",
    type: "base",
    schema: [
      { name: "user", type: "relation", collectionId: "_pb_users_auth_", maxSelect: 1, required: true },
      { name: "action", type: "text", required: true },
      { name: "collection_name", type: "text", required: true },
      { name: "record_id", type: "text", required: true },
      { name: "old_values", type: "json" },
      { name: "new_values", type: "json" },
      { name: "reason", type: "text" },
      { name: "ip_address", type: "text" },
      { name: "user_agent", type: "text" },
    ],
    listRule: "@request.auth.role ?= 'admin,lead_pastor,auditor'",
    viewRule: "@request.auth.role ?= 'admin,lead_pastor,auditor'",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null, // Inviolable
  });
  app.save(auditLogs);
}, (app) => {
  // Rollback logic if needed
});
