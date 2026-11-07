/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_739270338")

  // update collection data
  unmarshal({
    "listRule": "",
    "updateRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_739270338")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.role ?= 'admin,lead_pastor'",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
})
