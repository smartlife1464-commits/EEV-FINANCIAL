/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration de réparation globale (idempotente).
 *
 * Corrige les défauts structurels qui faisaient basculer l'API sur des données fictives :
 *  1. Ajout des champs système `created` / `updated` (autodate) absents de toutes les collections :
 *     tout tri `-created` échouait (HTTP 400) et l'API renvoyait des données de démonstration.
 *  2. Champs manquants des collections créées avec l'ancienne syntaxe `schema:` (audit_logs,
 *     departments, roles) : la piste d'audit n'enregistrait AUCUNE information.
 *  3. Champs numériques / booléens « requis » : PocketBase refuse 0 et false sur un champ requis
 *     (ex. 0 nouveau visiteur, écart de caisse nul, solde à 0). La validation reste assurée par Zod.
 *  4. Champs complémentaires pour la persistance réelle des PV de clôture de caisse.
 *  5. Nettoyage des enregistrements entièrement vides (tests manuels) et semis des données de
 *     référence indispensables (compartiments de fonds, catégories de recettes).
 */
migrate((app) => {
  const BUSINESS_COLLECTIONS = [
    'roles', 'departments', 'services', 'service_types', 'attendance_sheets',
    'fund_accounts', 'financial_categories', 'financial_entries', 'fund_allocations',
    'expense_categories', 'expenses', 'internal_transfers', 'fund_transactions',
    'audit_logs', 'fixed_expenses', 'fixed_expense_occurrences', 'expense_budgets',
    'cash_closings',
  ];

  const usersCollection = app.findCollectionByNameOrId('users');

  const tryFind = (name) => {
    try {
      return app.findCollectionByNameOrId(name);
    } catch (_) {
      return null;
    }
  };

  const addIfMissing = (collection, field) => {
    if (!collection.fields.getByName(field.name)) {
      collection.fields.add(field);
      return true;
    }
    return false;
  };

  // ---------------------------------------------------------------------------
  // 1-3. Structure : autodate, champs manquants, assouplissement des requis 0/false
  // ---------------------------------------------------------------------------
  for (const name of BUSINESS_COLLECTIONS) {
    const col = tryFind(name);
    if (!col) continue;

    addIfMissing(col, new AutodateField({ name: 'created', onCreate: true, onUpdate: false }));
    addIfMissing(col, new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));

    for (let i = 0; i < col.fields.length; i++) {
      const f = col.fields[i];
      const ftype = typeof f.type === 'function' ? f.type() : f.type;
      if ((ftype === 'number' || ftype === 'bool') && f.required) {
        f.required = false;
      }
    }

    if (name === 'audit_logs') {
      addIfMissing(col, new RelationField({ name: 'user', collectionId: usersCollection.id, maxSelect: 1 }));
      addIfMissing(col, new TextField({ name: 'action' }));
      addIfMissing(col, new TextField({ name: 'collection_name' }));
      addIfMissing(col, new TextField({ name: 'record_id' }));
      addIfMissing(col, new JSONField({ name: 'old_values' }));
      addIfMissing(col, new JSONField({ name: 'new_values' }));
      addIfMissing(col, new TextField({ name: 'reason' }));
      addIfMissing(col, new TextField({ name: 'ip_address' }));
      addIfMissing(col, new TextField({ name: 'user_agent' }));
      // Piste d'audit immuable : ni modification ni suppression via l'API publique
      col.updateRule = null;
      col.deleteRule = null;
    }

    if (name === 'departments') {
      addIfMissing(col, new TextField({ name: 'name' }));
      addIfMissing(col, new TextField({ name: 'code' }));
      addIfMissing(col, new TextField({ name: 'description' }));
      addIfMissing(col, new RelationField({ name: 'leader', collectionId: usersCollection.id, maxSelect: 1 }));
      addIfMissing(col, new BoolField({ name: 'is_active' }));
    }

    if (name === 'roles') {
      addIfMissing(col, new TextField({ name: 'name' }));
      addIfMissing(col, new TextField({ name: 'code' }));
      addIfMissing(col, new TextField({ name: 'description' }));
      addIfMissing(col, new JSONField({ name: 'permissions' }));
    }

    if (name === 'cash_closings') {
      addIfMissing(col, new TextField({ name: 'service_name' }));
      addIfMissing(col, new TextField({ name: 'closed_by_name' }));
      addIfMissing(col, new TextField({ name: 'status_label' }));
      const cashier = col.fields.getByName('cashier');
      if (cashier) cashier.required = false;
    }

    app.save(col);

    // Horodatage rétroactif des enregistrements existants (sinon colonne vide)
    const now = new Date().toISOString().replace('T', ' ');
    app.db()
      .newQuery(`UPDATE ${name} SET created = {:now} WHERE created IS NULL OR created = ''`)
      .bind({ now })
      .execute();
    app.db()
      .newQuery(`UPDATE ${name} SET updated = {:now} WHERE updated IS NULL OR updated = ''`)
      .bind({ now })
      .execute();
  }

  // ---------------------------------------------------------------------------
  // 5a. Nettoyage des enregistrements entièrement vides (créés lors de tests manuels)
  // ---------------------------------------------------------------------------
  const purgeBlank = (collectionName, keyField) => {
    const col = tryFind(collectionName);
    if (!col) return;
    const blanks = app.findRecordsByFilter(col, `${keyField} = ''`, '', 500, 0);
    for (const rec of blanks) {
      if (rec) app.delete(rec);
    }
  };

  purgeBlank('fund_transactions', 'transaction_number');
  purgeBlank('expenses', 'expense_number');
  purgeBlank('attendance_sheets', 'service_date');
  purgeBlank('services', 'name');
  purgeBlank('financial_categories', 'code');
  purgeBlank('expense_categories', 'code');
  purgeBlank('fund_accounts', 'code');

  // ---------------------------------------------------------------------------
  // 5b. Données de référence indispensables (créées seulement si absentes)
  // ---------------------------------------------------------------------------
  const upsertByCode = (collectionName, code, data) => {
    const col = tryFind(collectionName);
    if (!col) return null;
    try {
      return app.findFirstRecordByFilter(col, 'code = {:code}', { code });
    } catch (_) {
      const rec = new Record(col);
      rec.set('code', code);
      for (const key of Object.keys(data)) rec.set(key, data[key]);
      app.save(rec);
      return rec;
    }
  };

  const funds = {
    GENERAL: upsertByCode('fund_accounts', 'GENERAL', {
      name: 'Fonds Général (80% Dîmes/Offrandes)',
      description: 'Fonctionnement et charges courantes',
      current_balance: 0, is_restricted: false, is_active: true,
    }),
    TITHE_OF_TITHES: upsertByCode('fund_accounts', 'TITHE_OF_TITHES', {
      name: 'Dîme des Dîmes (10%)', description: 'Prélèvement statutaire de 10%',
      current_balance: 0, is_restricted: true, is_active: true,
    }),
    WELFARE_AID: upsertByCode('fund_accounts', 'WELFARE_AID', {
      name: 'Aide Sociale & Secours (10%)', description: 'Prélèvement statutaire de 10%',
      current_balance: 0, is_restricted: true, is_active: true,
    }),
    BUILDING: upsertByCode('fund_accounts', 'BUILDING', {
      name: 'Construction Auditorium', description: 'Fonds affecté à 100%',
      current_balance: 0, is_restricted: true, is_active: true,
    }),
    FRIENDS_OF_JESUS: upsertByCode('fund_accounts', 'FRIENDS_OF_JESUS', {
      name: 'Amis de Jésus', description: 'Cotisations affectées à 100%',
      current_balance: 0, is_restricted: true, is_active: true,
    }),
    SPECIAL_OFFERING: upsertByCode('fund_accounts', 'SPECIAL_OFFERING', {
      name: 'Offrandes Spéciales & Dons désignés', description: 'Dons à destination spéciale (100%)',
      current_balance: 0, is_restricted: true, is_active: true,
    }),
  };

  const categories = [
    ['tithes', 'Dîmes', 'standard_split_80_10_10', null, 'Dîmes des fidèles (ventilation 80/10/10)'],
    ['offerings', 'Offrandes ordinaires', 'standard_split_80_10_10', null, 'Offrandes de culte (ventilation 80/10/10)'],
    ['building', 'Don Construction Auditorium', 'direct_allocated', 'BUILDING', 'Affecté à 100% au fonds Auditorium'],
    ['friends_of_jesus', 'Cotisation Amis de Jésus', 'direct_allocated', 'FRIENDS_OF_JESUS', 'Affecté à 100% au fonds Amis de Jésus'],
    ['special_offerings', 'Offrande spéciale / Don désigné', 'direct_allocated', 'SPECIAL_OFFERING', 'Affecté à 100% au fonds Offrandes spéciales'],
  ];

  for (const [code, name, rule, fundCode, description] of categories) {
    const fund = fundCode ? funds[fundCode] : null;
    upsertByCode('financial_categories', code, {
      name,
      allocation_rule: rule,
      target_fund: fund ? fund.id : '',
      description,
      is_active: true,
    });
  }
}, (app) => {
  // Migration de réparation : pas de retour arrière destructif (les champs ajoutés sont conservés).
});
