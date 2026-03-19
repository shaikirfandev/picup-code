#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/seed-cosmos-images.js"

URLS_FILE=""
AUTHOR_EMAIL="cosmos.seed@picup.local"
AUTHOR_NAME="Cosmos Seed Bot"
AUTHOR_USERNAME="cosmos_seed_bot"
CATEGORY_NAME="Photography"
TITLE_PREFIX="Cosmos Import"
TAGS="cosmos,imported,inspiration"
STATUS="published"
KEEP_DOWNLOADS=0
AUTO_CLEANUP=1
DOWNLOAD_DIR=""

usage() {
  cat <<'EOF'
Usage:
  bash src/seeds/download-and-seed-cosmos.sh --urls-file <file> [options]

This script downloads a vetted list of Cosmos CDN image URLs, uploads them into
PicUp's GridFS storage, and creates Post records in MongoDB.

Important:
  - This script does not discover or scrape image URLs from cdn.cosmos.so.
  - Only include URLs you have permission and licensing rights to import.
  - Input file format: one https://cdn.cosmos.so/... URL per line.
  - Blank lines and lines starting with # are ignored.

Options:
  --urls-file <file>         Text file with approved Cosmos CDN URLs. Required.
  --download-dir <dir>       Keep raw downloads in this directory.
  --author-email <email>     Seed author email. Default: cosmos.seed@picup.local
  --author-name <name>       Seed author display name. Default: Cosmos Seed Bot
  --author-username <name>   Seed author username. Default: cosmos_seed_bot
  --category <name>          Post category name. Default: Photography
  --title-prefix <text>      Title prefix for created posts. Default: Cosmos Import
  --tags <csv>               Comma-separated tags. Default: cosmos,imported,inspiration
  --status <status>          Post status. Default: published
  --keep-downloads           Preserve the downloaded raw files after import.
  --help                     Show this help message.

Examples:
  bash src/seeds/download-and-seed-cosmos.sh \
    --urls-file src/seeds/cosmos-urls.example.txt \
    --author-email admin@picup.app \
    --category "Art & Design"
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

guess_extension_from_url() {
  local url="$1"
  local ext=""

  if [[ "$url" =~ [\?\&]format=([A-Za-z0-9]+) ]]; then
    ext="${BASH_REMATCH[1]}"
  else
    local without_query="${url%%\?*}"
    local basename_part="${without_query##*/}"
    if [[ "$basename_part" == *.* ]]; then
      ext="${basename_part##*.}"
    fi
  fi

  if [[ -z "$ext" ]]; then
    ext="img"
  fi

  printf '%s' "${ext,,}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --urls-file)
      URLS_FILE="${2:-}"
      shift 2
      ;;
    --download-dir)
      DOWNLOAD_DIR="${2:-}"
      AUTO_CLEANUP=0
      shift 2
      ;;
    --author-email)
      AUTHOR_EMAIL="${2:-}"
      shift 2
      ;;
    --author-name)
      AUTHOR_NAME="${2:-}"
      shift 2
      ;;
    --author-username)
      AUTHOR_USERNAME="${2:-}"
      shift 2
      ;;
    --category)
      CATEGORY_NAME="${2:-}"
      shift 2
      ;;
    --title-prefix)
      TITLE_PREFIX="${2:-}"
      shift 2
      ;;
    --tags)
      TAGS="${2:-}"
      shift 2
      ;;
    --status)
      STATUS="${2:-}"
      shift 2
      ;;
    --keep-downloads)
      KEEP_DOWNLOADS=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$URLS_FILE" ]]; then
  echo "--urls-file is required." >&2
  usage
  exit 1
fi

if [[ ! -f "$URLS_FILE" ]]; then
  echo "URL list not found: $URLS_FILE" >&2
  exit 1
fi

require_cmd curl
require_cmd node

mkdir -p "$BACKEND_DIR/.tmp"

if [[ -z "$DOWNLOAD_DIR" ]]; then
  DOWNLOAD_DIR="$(mktemp -d "$BACKEND_DIR/.tmp/cosmos-downloads.XXXXXX")"
fi

cleanup() {
  if [[ "$AUTO_CLEANUP" -eq 1 && "$KEEP_DOWNLOADS" -eq 0 && -d "$DOWNLOAD_DIR" ]]; then
    rm -rf "$DOWNLOAD_DIR"
  fi
}

trap cleanup EXIT

mkdir -p "$DOWNLOAD_DIR"

MANIFEST_FILE="$DOWNLOAD_DIR/manifest.tsv"
: > "$MANIFEST_FILE"

downloaded=0
skipped=0
line_no=0

while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
  line_no=$((line_no + 1))
  line="$(printf '%s' "$raw_line" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"

  if [[ -z "$line" || "$line" == \#* ]]; then
    continue
  fi

  if [[ ! "$line" =~ ^https://cdn\.cosmos\.so/ ]]; then
    echo "Skipping non-Cosmos URL on line $line_no: $line" >&2
    skipped=$((skipped + 1))
    continue
  fi

  downloaded=$((downloaded + 1))
  extension="$(guess_extension_from_url "$line")"
  file_path="$DOWNLOAD_DIR/cosmos-$(printf '%04d' "$downloaded").$extension"

  echo "Downloading [$downloaded] $line"
  curl --fail --location --silent --show-error "$line" -o "$file_path"

  if [[ ! -s "$file_path" ]]; then
    echo "Downloaded file is empty: $line" >&2
    rm -f "$file_path"
    downloaded=$((downloaded - 1))
    skipped=$((skipped + 1))
    continue
  fi

  printf '%s\t%s\n' "$line" "$file_path" >> "$MANIFEST_FILE"
done < "$URLS_FILE"

if [[ "$downloaded" -eq 0 ]]; then
  echo "No images were downloaded. Nothing to seed." >&2
  exit 1
fi

echo "Downloaded $downloaded file(s) to $DOWNLOAD_DIR"
if [[ "$skipped" -gt 0 ]]; then
  echo "Skipped $skipped line(s)."
fi

node "$NODE_SCRIPT" \
  --manifest "$MANIFEST_FILE" \
  --author-email "$AUTHOR_EMAIL" \
  --author-name "$AUTHOR_NAME" \
  --author-username "$AUTHOR_USERNAME" \
  --category "$CATEGORY_NAME" \
  --title-prefix "$TITLE_PREFIX" \
  --tags "$TAGS" \
  --status "$STATUS"

if [[ "$KEEP_DOWNLOADS" -eq 1 || "$AUTO_CLEANUP" -eq 0 ]]; then
  echo "Raw downloads kept in: $DOWNLOAD_DIR"
fi
