/// <reference path="../pb_data/types.d.ts" />
/**
 * Rétablit la relation échéance → charge fixe sur les installations neuves (idempotent).
 * Voir 1794051970_created_fixed_expense_occurrences.js : sur une base vierge, la collection
 * « fixed_expenses » n'existait pas encore au moment de créer les échéances.
 */
migrate((app) => {
  const occurrences = app.findCollectionByNameOrId('fixed_expense_occurrences');
  if (occurrences.fields.getByName('fixed_expense')) return;
  const fixedExpenses = app.findCollectionByNameOrId('fixed_expenses');
  occurrences.fields.add(new RelationField({
    name: 'fixed_expense',
    collectionId: fixedExpenses.id,
    maxSelect: 1,
    required: true,
  }));
  app.save(occurrences);
}, (app) => {
  /* pas de retour arrière : la relation fait partie du schéma de référence */
});
