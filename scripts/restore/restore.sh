#!/usr/bin/env bash
set -euo pipefail

# Script de restauration sécurisée
if [ $# -eq 0 ]; then
  echo "Usage: $0 <chemin_vers_archive_backup.tar.gz>"
  exit 1
fi

ARCHIVE_PATH="$1"
PB_DATA_DIR="${PB_DATA_DIR:-./pocketbase/pb_data}"

if [ ! -f "${ARCHIVE_PATH}" ]; then
  echo "❌ Fichier d'archive introuvable : ${ARCHIVE_PATH}"
  exit 1
fi

echo "⚠️ ATTENTION : Vous allez écraser la base active (${PB_DATA_DIR})."
echo "⏳ Décompression de ${ARCHIVE_PATH}..."

mkdir -p "${PB_DATA_DIR}"
tar -xzf "${ARCHIVE_PATH}" -C "${PB_DATA_DIR}"

echo "✅ Restauration terminée avec succès dans ${PB_DATA_DIR}."
