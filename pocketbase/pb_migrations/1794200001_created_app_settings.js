/// <reference path="../pb_data/types.d.ts" />
/**
 * Paramètres institutionnels persistants (identité du ministère utilisée sur les documents officiels,
 * capacité d'accueil, etc.). Une ligne par clé, valeur JSON.
 */
migrate((app) => {
  let existing = null;
  try {
    existing = app.findCollectionByNameOrId('app_settings');
  } catch (_) {
    existing = null;
  }
  if (existing) return;

  const collection = new Collection({
    name: 'app_settings',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: 'key', type: 'text', required: true },
      { name: 'value', type: 'json', maxSize: 200000 },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_app_settings_key ON app_settings (key)'],
  });
  app.save(collection);

  const rec = new Record(collection);
  rec.set('key', 'ministry');
  rec.set('value', {
    name: '',
    headquarters: '',
    postalBox: '',
    phone: '',
    email: '',
    website: '',
    mainPastor: '',
    venueCapacity: 0,
  });
  app.save(rec);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId('app_settings');
    app.delete(collection);
  } catch (_) {
    /* déjà supprimée */
  }
});
