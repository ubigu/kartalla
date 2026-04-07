#!/usr/bin/env bash
set -euo pipefail

# Directories containing package.json files to update
WORKSPACES=("." "client" "server" "e2e")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── helpers ───────────────────────────────────────────────────────────────────

print_header() {
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║        Dependency Updater            ║"
  echo "╚══════════════════════════════════════╝"
  echo ""
}

ask() {
  # ask <prompt> <variable_name>
  local prompt="$1"
  local varname="$2"
  read -r -p "$prompt" "$varname"
}

select_option() {
  local prompt="$1"
  shift
  local options=("$@")
  echo "$prompt"
  for i in "${!options[@]}"; do
    echo "  $((i+1))) ${options[$i]}"
  done
  local choice
  while true; do
    ask "Enter choice [1-${#options[@]}]: " choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= ${#options[@]} )); then
      SELECTED_INDEX=$((choice - 1))
      return
    fi
    echo "  Invalid choice, try again."
  done
}

# ── main ──────────────────────────────────────────────────────────────────────

print_header

# 1. Choose update level
select_option "Select update level:" "patch  – x.y.Z  (safest)" "minor  – x.Y.z" "major  – X.y.z  (breaking)"
LEVEL_INDEX=$SELECTED_INDEX

case $LEVEL_INDEX in
  0) TARGET="patch";  NCU_TARGET="patch"  ;;
  1) TARGET="minor";  NCU_TARGET="minor"  ;;
  2) TARGET="major";  NCU_TARGET="latest" ;;
esac

echo ""
echo "Update level: $TARGET"
echo ""

# 2. Cooldown period
echo ""
ask "Cooldown period – minimum version age to consider (e.g. 7d, 12h, 30m; press Enter to skip): " cooldown_input
COOLDOWN=""
if [[ -n "$cooldown_input" ]]; then
  if [[ "$cooldown_input" =~ ^[0-9]+([dhm])?$ ]]; then
    # bare number is treated as days
    [[ "$cooldown_input" =~ ^[0-9]+$ ]] && cooldown_input="${cooldown_input}d"
    COOLDOWN="$cooldown_input"
    echo "  Cooldown: $COOLDOWN"
  else
    echo "  Invalid format – skipping cooldown. Use a number (days) or e.g. 7d / 12h / 30m."
  fi
fi
echo ""

# 3. Choose interactive or non-interactive
select_option "Run mode:" "interactive  – pick packages one by one" "all          – update all matching packages"
MODE_INDEX=$SELECTED_INDEX

INTERACTIVE=false
[[ $MODE_INDEX -eq 0 ]] && INTERACTIVE=true

# 4. Choose which workspaces
echo ""
echo "Available workspaces:"
for i in "${!WORKSPACES[@]}"; do
  ws="${WORKSPACES[$i]}"
  label="$ws"
  [[ "$ws" == "." ]] && label="root (.)"
  echo "  $((i+1))) $label"
done
echo "  $((${#WORKSPACES[@]}+1))) all"

SELECTED_WORKSPACES=()
ask "Enter workspace numbers separated by spaces (or press Enter for all): " ws_input

if [[ -z "$ws_input" ]]; then
  SELECTED_WORKSPACES=("${WORKSPACES[@]}")
else
  for n in $ws_input; do
    if [[ "$n" -eq "$((${#WORKSPACES[@]}+1))" ]]; then
      SELECTED_WORKSPACES=("${WORKSPACES[@]}")
      break
    elif (( n >= 1 && n <= ${#WORKSPACES[@]} )); then
      SELECTED_WORKSPACES+=("${WORKSPACES[$((n-1))]}")
    else
      echo "  Skipping unknown workspace number: $n"
    fi
  done
fi

echo ""
echo "Workspaces to process: ${SELECTED_WORKSPACES[*]}"
echo ""

# 5. Run ncu for each selected workspace
for ws in "${SELECTED_WORKSPACES[@]}"; do
  ws_path="$ROOT_DIR/$ws"
  ws_label="$ws"
  [[ "$ws" == "." ]] && ws_label="root"

  if [[ ! -f "$ws_path/package.json" ]]; then
    echo "⚠  Skipping $ws_label – no package.json found"
    continue
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Workspace: $ws_label"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  NCU_ARGS=(--target "$NCU_TARGET" --packageFile "$ws_path/package.json")
  [[ -n "$COOLDOWN" ]] && NCU_ARGS+=(--cooldown "$COOLDOWN")

  if $INTERACTIVE; then
    NCU_ARGS+=(--interactive)
  else
    NCU_ARGS+=(--upgrade)
  fi

  npx --yes npm-check-updates "${NCU_ARGS[@]}"

  echo ""
done

echo "Done. Run your package manager to install updated dependencies."
echo "  e.g.  pnpm install"
