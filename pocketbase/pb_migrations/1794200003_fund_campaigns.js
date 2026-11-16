/// <reference path="../pb_data/types.d.ts" />
/**
 * Compartiments de caisse enrichis et quêtes spontanées temporaires (idempotent).
 *
 *  - kind            : « permanent » (compartiment durable) ou « campaign » (quête spontanée)
 *  - target_amount   : somme à atteindre (quêtes)
 *  - start_date / end_date : période de collecte (délai de la quête)
 *  - status          : « active » ou « closed »
 *  - color           : couleur d'affichage
 *  - revenue_category: catégorie de recette qui alimente le compartiment à 100 %
 *  - created_by      : auteur de la création
 */
migrate((app) => {
  const funds = app.findCollectionByNameOrId('fund_accounts');
  const users = app.findCollectionByNameOrId('users');
  const categories = app.findCollectionByNameOrId('financial_categories');

  const addIfMissing = (field) => {
    if (!funds.fields.getByName(field.name)) funds.fields.add(field);
  };

  addIfMissing(new TextField({ name: 'kind' }));
  addIfMissing(new NumberField({ name: 'target_amount', min: 0 }));
  addIfMissing(new TextField({ name: 'start_date' }));
  addIfMissing(new TextField({ name: 'end_date' }));
  addIfMissing(new TextField({ name: 'status' }));
  addIfMissing(new TextField({ name: 'color' }));
  addIfMissing(new RelationField({ name: 'revenue_category', collectionId: categories.id, maxSelect: 1 }));
  addIfMissing(new RelationField({ name: 'created_by', collectionId: users.id, maxSelect: 1 }));
  app.save(funds);

  // Valeurs par défaut des compartiments existants
  app.db().newQuery("UPDATE fund_accounts SET kind = 'permanent' WHERE kind IS NULL OR kind = ''").execute();
  app.db().newQuery("UPDATE fund_accounts SET status = 'active' WHERE status IS NULL OR status = ''").execute();
}, (app) => {
  /* Champs conservés : leur suppression effacerait l'historique des quêtes */
});
