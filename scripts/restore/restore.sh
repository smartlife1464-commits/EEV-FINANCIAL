#!/usr/bin/env bash
set -euo pipefail

# Restauration d'une sauvegarde PocketBase.
# Une copie de sécurité de la base actuelle est créée AVANT toute écriture.
if [ $# -eq 0 ]; then
  echo "Usage: $0 <chemin_vers_archive_backup.tar.gz> [--yes]"
  exit 1
fi

ARCHIVE_PATH="$1"
PB_DATA_DIR="${PB_DATA_DIR:-./pocketbase/pb_data}"

if [ ! -f "${ARCHIVE_PATH}" ]; then
  echo "❌ Fichier d'archive introuvable : ${ARCHIVE_PATH}"
  exit 1
fi

if ! tar -tzf "${ARCHIVE_PATH}" | grep -q 'data.db'; then
  echo "❌ L'archive ne contient pas de base data.db : restauration annulée."
  exit 1
fi

echo "⚠️ ATTENTION : la base active (${PB_DATA_DIR}) va être remplacée. Arrêtez PocketBase avant de continuer."
if [ "${2:-}" != "--yes" ]; then
  read -r -p "Confirmer la restauration ? (oui/non) " answer
  [ "${answer}" = "oui" ] || { echo "Restauration annulée."; exit 1; }
fi

if [ -d "${PB_DATA_DIR}" ]; then
  SAFETY="${PB_DATA_DIR%/}_avant_restauration_$(date +%Y%m%d_%H%M%S).tar.gz"
  tar -czf "${SAFETY}" -C "${PB_DATA_DIR}" .
  echo "🛟 Copie de sécurité de la base actuelle : ${SAFETY}"
fi

mkdir -p "${PB_DATA_DIR}"
rm -f "${PB_DATA_DIR}/data.db-wal" "${PB_DATA_DIR}/data.db-shm" "${PB_DATA_DIR}/auxiliary.db-wal" "${PB_DATA_DIR}/auxiliary.db-shm"
tar -xzf "${ARCHIVE_PATH}" -C "${PB_DATA_DIR}"

echo "✅ Restauration terminée dans ${PB_DATA_DIR}. Redémarrez PocketBase (les migrations en attente seront appliquées)."
