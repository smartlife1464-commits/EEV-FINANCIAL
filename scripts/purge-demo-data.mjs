#!/usr/bin/env node
/**
 * Mise en production : retire toutes les données de démonstration et de test d'une base PocketBase.
 *
 *  - sauvegarde complète préalable (pb_data/backups)
 *  - supprime les écritures (recettes, dépenses, transactions, transferts, charges fixes, budgets,
 *    clôtures, fiches de culte, journal d'audit) et les quêtes spontanées
 *  - remet le solde de chaque compartiment à 0
 *  - supprime tous les comptes utilisateurs (y compris les 7 comptes de démonstration)
 *  - supprime les départements vides (données erronées)
 *  - conserve la structure : compartiments permanents, catégories, types de culte, rôles, identité
 *
 * Ensuite, ouvrez l'application web : l'assistant d'installation crée l'administrateur de la plateforme.
 *
 * Usage : node --env-file=apps/api/.env scripts/purge-demo-data.mjs --yes
 */
import PocketBase from 'pocketbase';

const url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!process.argv.includes('--yes')) {
  console.error('Opération destructive : relancez avec --yes pour confirmer.');
  process.exit(1);
}
if (!email || !password) {
  console.error('POCKETBASE_ADMIN_EMAIL et POCKETBASE_ADMIN_PASSWORD sont requis (ex. --env-file=apps/api/.env).');
  process.exit(1);
}

const pb = new PocketBase(url);
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(email, password);

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backup = `avant_mise_en_production_${stamp}.zip`;
await pb.backups.create(backup);
console.log(`✔ Sauvegarde : pb_data/backups/${backup}`);

const TRANSACTIONAL = [
  'fund_allocations', 'fund_transactions', 'financial_entries', 'internal_transfers',
  'fixed_expense_occurrences', 'expenses', 'fixed_expenses', 'expense_budgets',
  'cash_closings', 'attendance_sheets', 'services', 'audit_logs',
];

const wipe = async (name, filter) => {
  const items = await pb.collection(name).getFullList({ fields: 'id', ...(filter ? { filter } : {}) }).catch(() => []);
  for (const it of items) await pb.collection(name).delete(it.id);
  console.log(`✔ ${name} : ${items.length} supprimé(s)`);
  return items.length;
};

for (const name of TRANSACTIONAL) await wipe(name);

const campaigns = await pb.collection('fund_accounts').getFullList({ filter: "kind = 'campaign'" });
for (const c of campaigns) {
  await pb.collection('fund_accounts').delete(c.id);
  if (c.revenue_category) await pb.collection('financial_categories').delete(c.revenue_category).catch(() => null);
}
console.log(`✔ quêtes spontanées : ${campaigns.length} supprimée(s)`);

const funds = await pb.collection('fund_accounts').getFullList();
for (const f of funds) await pb.collection('fund_accounts').update(f.id, { current_balance: 0 });
console.log(`✔ soldes remis à 0 : ${funds.length} compartiment(s)`);

await wipe('users');
await wipe('departments', "name = '' && code = ''");

// La configuration redevient « à installer » ; l'identité officielle est conservée
const platform = await pb.collection('app_settings').getFirstListItem(`key = "platform"`).catch(() => null);
if (platform) await pb.collection('app_settings').delete(platform.id);

console.log('\nBase prête pour la production. Ouvrez l’application web pour créer l’administrateur de la plateforme.');
