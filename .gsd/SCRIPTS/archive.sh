#!/usr/bin/env bash
set -euo pipefail

DAYS="${1:-30}"
ARCHIVE_DIR=".gsd/ARCHIVE"
CHANGES_DIR=".gsd/CHANGES"
SESSIONS_DIR=".gsd/SESSIONS"

mkdir -p "${ARCHIVE_DIR}/CHANGES" "${ARCHIVE_DIR}/SESSIONS"

ARCHIVED=0

archive_old_files() {
  local src_dir="$1"
  local dst_dir="$2"

  if [ ! -d "$src_dir" ]; then
    return
  fi

  while IFS= read -r -d '' file; do
    mv "$file" "$dst_dir/"
    echo "Archived: $file"
    ARCHIVED=$((ARCHIVED + 1))
  done < <(find "$src_dir" -maxdepth 1 -type f -mtime +"$DAYS" -print0)
}

archive_old_files "$CHANGES_DIR" "${ARCHIVE_DIR}/CHANGES"
archive_old_files "$SESSIONS_DIR" "${ARCHIVE_DIR}/SESSIONS"

echo "Done. Archived ${ARCHIVED} file(s) older than ${DAYS} days."

if [ -f ".gsd/SCRIPTS/update-index.sh" ]; then
  bash ".gsd/SCRIPTS/update-index.sh"
fi
