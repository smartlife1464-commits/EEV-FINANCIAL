import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
pb.autoCancellation(false);

async function seed() {
  console.log('🌱 [EEV-SEED] Démarrage du peuplement complet de PocketBase...');

  // 1. Authentification Superuser
  try {
    await pb.collection('_superusers').authWithPassword('admin@espritvie.org', 'AdminEspritVie2026!');
    console.log('✅ Authentifié avec succès en tant que Superuser.');
  } catch (err) {
    console.error('❌ Échec authentification superuser:', err.message);
    process.exit(1);
  }

  // 2. Rôles RBAC
  const rolesData = [
    { name: 'Administrateur Général', code: 'admin', description: 'Gestion technique et droits d’accès' },
    { name: 'Leader Principal', code: 'lead_pastor', description: 'Gouvernance, vision globale et autorisation souveraine des dépenses' },
    { name: 'Responsable Finances', code: 'finance_lead', description: 'Gestion de caisse, saisie des recettes et proposition des dépenses' },
    { name: 'Caissier / Agent Financier', code: 'cashier', description: 'Encaissement et décaissement physique après autorisation' },
    { name: 'Responsable Protocole', code: 'protocol_lead', description: 'Supervision de la fréquentation et validation des fiches de culte' },
    { name: 'Agent Protocole', code: 'protocol_agent', description: 'Comptage exclusif (Hommes, Femmes, Jeunes, Enfants) et nouveaux visiteurs' },
    { name: 'Auditeur / Contrôleur', code: 'auditor', description: 'Consultation immuable des comptes et des journaux d’audit' },
  ];

  for (const r of rolesData) {
    try {
      const existing = await pb.collection('roles').getFirstListItem(`code = "${r.code}"`);
      console.log(`ℹ️ Rôle ${r.code} déjà existant.`);
    } catch {
      await pb.collection('roles').create({ ...r, permissions: {} });
      console.log(`➕ Rôle créé: ${r.name}`);
    }
  }

  // 3. Départements
  const depts = [
    { name: 'Gouvernance & Pastorat', code: 'DIR', is_active: true },
    { name: 'Département Finances & Caisse', code: 'FIN', is_active: true },
    { name: 'Département Protocole & Accueil', code: 'PROT', is_active: true },
    { name: 'Contrôle Interne & Audit', code: 'AUD', is_active: true },
  ];
  const deptMap = {};
  for (const d of depts) {
    try {
      const rec = await pb.collection('departments').getFirstListItem(`code = "${d.code}"`);
      deptMap[d.code] = rec.id;
    } catch {
      const rec = await pb.collection('departments').create(d);
      deptMap[d.code] = rec.id;
      console.log(`➕ Département créé: ${d.name}`);
    }
  }

  // 4. Utilisateurs de test
  const usersData = [
    { email: 'leader@espritvie.org', password: 'Leader2026!', name: 'Pasteur Principal', role: 'lead_pastor', dept: deptMap['DIR'] },
    { email: 'admin@espritvie.org', password: 'Admin2026!', name: 'Administrateur Général', role: 'admin', dept: deptMap['DIR'] },
    { email: 'finance@espritvie.org', password: 'Finance2026!', name: 'Responsable Finances', role: 'finance_lead', dept: deptMap['FIN'] },
    { email: 'caissier@espritvie.org', password: 'Caissier2026!', name: 'Caissier Principal', role: 'cashier', dept: deptMap['FIN'] },
    { email: 'protocol@espritvie.org', password: 'Protocol2026!', name: 'Responsable Protocole', role: 'protocol_lead', dept: deptMap['PROT'] },
    { email: 'agent@espritvie.org', password: 'Agent2026!', name: 'Agent Protocole', role: 'protocol_agent', dept: deptMap['PROT'] },
    { email: 'auditeur@espritvie.org', password: 'Auditeur2026!', name: 'Auditeur / Contrôleur', role: 'auditor', dept: deptMap['AUD'] },
  ];

  const userMap = {};
  for (const u of usersData) {
    try {
      const rec = await pb.collection('users').getFirstListItem(`email = "${u.email}"`);
      userMap[u.email] = rec.id;
    } catch {
      try {
        const rec = await pb.collection('users').create({
          email: u.email,
          password: u.password,
          passwordConfirm: u.password,
          name: u.name,
          role: u.role,
          department: u.dept || null,
          is_active: true,
        });
        userMap[u.email] = rec.id;
        console.log(`➕ Utilisateur créé: ${u.name} (${u.email})`);
      } catch (e) {
        console.warn(`Note sur ${u.email}:`, e.message);
      }
    }
  }

  // 5. Compartiments analytiques de la caisse consolidée
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
      // Actualiser le solde de départ
      await pb.collection('fund_accounts').update(rec.id, { current_balance: f.current_balance });
    } catch {
      const rec = await pb.collection('fund_accounts').create(f);
      fundMap[f.code] = rec.id;
      console.log(`➕ Compartiment créé: ${f.name} (${f.current_balance} FCFA)`);
    }
  }

  // 6. Catégories Financières
  const finCats = [
    { code: 'tithes', name: 'Dîmes', allocation_rule: 'standard_split_80_10_10', is_active: true },
    { code: 'offerings', name: 'Offrandes Ordinaires', allocation_rule: 'standard_split_80_10_10', is_active: true },
    { code: 'building', name: 'Don Construction Auditorium', allocation_rule: 'direct_allocated', target_fund: fundMap['BUILDING'], is_active: true },
    { code: 'friends_of_jesus', name: 'Don Amis de Jésus', allocation_rule: 'direct_allocated', target_fund: fundMap['FRIENDS_OF_JESUS'], is_active: true },
    { code: 'special_offerings', name: 'Offrande Spéciale Affectée', allocation_rule: 'direct_allocated', target_fund: fundMap['BUILDING'], is_active: true },
  ];

  const catMap = {};
  for (const c of finCats) {
    try {
      const rec = await pb.collection('financial_categories').getFirstListItem(`code = "${c.code}"`);
      catMap[c.code] = rec.id;
    } catch {
      const rec = await pb.collection('financial_categories').create(c);
      catMap[c.code] = rec.id;
      console.log(`➕ Catégorie d'encaissement créée: ${c.name}`);
    }
  }

  // 7. Catégories de Dépenses
  const expCats = [
    { code: 'electricity', name: 'Électricité & Énergie', is_active: true },
    { code: 'water', name: 'Eau & Assainissement', is_active: true },
    { code: 'transport', name: 'Transport & Logistique', is_active: true },
    { code: 'communication', name: 'Communication & Médias', is_active: true },
    { code: 'maintenance', name: 'Entretien & Réparations', is_active: true },
    { code: 'equipment', name: 'Matériel & Sonorisation', is_active: true },
  ];

  const expCatMap = {};
  for (const ec of expCats) {
    try {
      const rec = await pb.collection('expense_categories').getFirstListItem(`code = "${ec.code}"`);
      expCatMap[ec.code] = rec.id;
    } catch {
      const rec = await pb.collection('expense_categories').create(ec);
      expCatMap[ec.code] = rec.id;
      console.log(`➕ Catégorie de dépense créée: ${ec.name}`);
    }
  }

  // 8. Services de Culte
  const servicesData = [
    { name: 'Culte de Célébration et d’Adoration', service_type: 'sunday_service', date: '2026-11-01', start_time: '09:00', end_time: '12:00', status: 'completed' },
    { name: 'Programme d’Enseignement Biblique', service_type: 'tuesday_program', date: '2026-11-03', start_time: '18:00', end_time: '20:30', status: 'completed' },
    { name: 'Prière d’Intercession & Délivrance', service_type: 'thursday_program', date: '2026-11-05', start_time: '18:00', end_time: '20:30', status: 'completed' },
  ];

  const serviceMap = {};
  for (const s of servicesData) {
    try {
      const rec = await pb.collection('services').getFirstListItem(`name = "${s.name}"`);
      serviceMap[s.service_type] = rec.id;
    } catch {
      const rec = await pb.collection('services').create(s);
      serviceMap[s.service_type] = rec.id;
      console.log(`➕ Service créé: ${s.name}`);
    }
  }

  // 9. Fiches de Présence (Formule Hommes + Femmes + Jeunes + Enfants = Total Strict)
  const sundayServiceId = serviceMap['sunday_service'];
  if (sundayServiceId) {
    try {
      await pb.collection('attendance_sheets').getFirstListItem(`service = "${sundayServiceId}"`);
    } catch {
      await pb.collection('attendance_sheets').create({
        service: sundayServiceId,
        men_count: 145,
        women_count: 198,
        youth_count: 92,
        children_count: 65,
        total_attendance: 500, // 145 + 198 + 92 + 65 = 500
        new_visitors_count: 32, // Non additionné au total
        salvations_count: 14,
        notes: 'Forte présence spirituelle, 50 chaises additionnelles disposées au fond.',
        status: 'validated',
        submitted_by: userMap['protocol@espritvie.org'] || userMap['leader@espritvie.org'],
      });
      console.log('➕ Fiche de présence culte dominical créée (500 fidèles, +32 nouveaux visiteurs).');
    }
  }

  // 10. Dépenses d'exemple
  const demoExpenses = [
    {
      expense_number: 'DEP-2026-00001',
      category: expCatMap['electricity'],
      fund_account: fundMap['GENERAL'],
      amount: 150000,
      beneficiary: 'ENEO Cameroun',
      purpose: 'Facture électricité du temple pour le mois précédent',
      status: 'pending_approval',
      requested_by: userMap['finance@espritvie.org'] || userMap['admin@espritvie.org'],
    },
    {
      expense_number: 'DEP-2026-00002',
      category: expCatMap['maintenance'],
      fund_account: fundMap['GENERAL'],
      amount: 200000,
      beneficiary: 'Sonel Eaux',
      purpose: 'Réparation plomberie et raccordement annexe',
      status: 'approved',
      requested_by: userMap['finance@espritvie.org'] || userMap['admin@espritvie.org'],
    },
    {
      expense_number: 'DEP-2026-00003',
      category: expCatMap['equipment'],
      fund_account: fundMap['GENERAL'],
      amount: 480000,
      beneficiary: 'Audio Pro Yaoundé',
      purpose: 'Câblage micros HF et retour régie son',
      status: 'paid',
      requested_by: userMap['finance@espritvie.org'] || userMap['admin@espritvie.org'],
    },
  ];

  for (const exp of demoExpenses) {
    if (exp.category && exp.fund_account) {
      try {
        await pb.collection('expenses').getFirstListItem(`expense_number = "${exp.expense_number}"`);
      } catch {
        await pb.collection('expenses').create(exp);
        console.log(`➕ Dépense créée: ${exp.expense_number} (${exp.amount} FCFA)`);
      }
    }
  }

  // 11. Grand livre d'exemple
  const demoTransactions = [
    {
      transaction_number: 'TX-2026-000001',
      fund_account: fundMap['GENERAL'],
      type: 'credit_entry',
      direction: 'credit',
      amount: 2000000,
      balance_after: 8500000,
      description: 'Recette REC-2026-00001 - 80% Fonds Général',
      created_by: userMap['finance@espritvie.org'] || userMap['admin@espritvie.org'],
    },
    {
      transaction_number: 'TX-2026-000002',
      fund_account: fundMap['TITHE_OF_TITHES'],
      type: 'credit_entry',
      direction: 'credit',
      amount: 250000,
      balance_after: 1450000,
      description: 'Recette REC-2026-00001 - 10% Dîme des dîmes',
      created_by: userMap['finance@espritvie.org'] || userMap['admin@espritvie.org'],
    },
    {
      transaction_number: 'TX-2026-000003',
      fund_account: fundMap['WELFARE_AID'],
      type: 'credit_entry',
      direction: 'credit',
      amount: 250000,
      balance_after: 1300000,
      description: 'Recette REC-2026-00001 - 10% Aide sociale',
      created_by: userMap['finance@espritvie.org'] || userMap['admin@espritvie.org'],
    },
  ];

  for (const tx of demoTransactions) {
    if (tx.fund_account) {
      try {
        await pb.collection('fund_transactions').getFirstListItem(`transaction_number = "${tx.transaction_number}"`);
      } catch {
        await pb.collection('fund_transactions').create(tx);
        console.log(`➕ Écriture au grand livre: ${tx.transaction_number}`);
      }
    }
  }

  console.log('🎉 [EEV-SEED] Peuplement de la base PocketBase terminé avec succès !');
}

seed().catch(console.error);
