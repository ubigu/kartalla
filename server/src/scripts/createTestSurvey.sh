#!/usr/bin/env bash
# Run from server/ directory:
#   bash src/scripts/createTestSurvey.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$SERVER_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Copy .template.env to .env and fill in the values." >&2
  exit 1
fi

# Parse required variables from .env without sourcing (avoids issues with special chars)
_get_env() { grep "^$1=" "$ENV_FILE" | head -1 | cut -d'=' -f2-; }

DATABASE_URL="$(_get_env DATABASE_URL)"
DATABASE_ENCRYPTION_KEY="$(_get_env DATABASE_ENCRYPTION_KEY)"

# Replace Docker service hostname with localhost
DATABASE_URL="${DATABASE_URL//@database:/@localhost:}"

export DATABASE_URL DATABASE_ENCRYPTION_KEY

# Show the effective URL (password masked) for debugging
echo "Connecting to: $(echo "$DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://***:***@|')"

cd "$SERVER_DIR"
npx ts-node -r tsconfig-paths/register src/scripts/createTestSurvey.ts
