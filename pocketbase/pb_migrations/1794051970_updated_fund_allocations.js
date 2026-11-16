/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3243387290")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3807898046",
    "hidden": false,
    "id": "relation1514174303",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "financial_entry",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_739270338",
    "hidden": false,
    "id": "relation2436005357",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "fund_account",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2392944706",
    "max": null,
    "min": null,
    "name": "amount",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number2466988094",
    "max": null,
    "min": null,
    "name": "percentage",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3208210256",
    "max": 0,
    "min": 0,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3243387290")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    "viewRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'"
  }, collection)

  // remove field
  collection.fields.removeById("relation1514174303")

  // remove field
  collection.fields.removeById("relation2436005357")

  // remove field
  collection.fields.removeById("number2392944706")

  // remove field
  collection.fields.removeById("number2466988094")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 15,
    "min": 15,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  return app.save(collection)
})
