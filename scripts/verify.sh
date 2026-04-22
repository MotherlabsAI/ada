#!/usr/bin/env bash
# verify.sh — chain the full pre-commit verification pipeline for ada.
# Skip flags: SKIP_INSTALL=1, SKIP_TESTS=1, SKIP_DOCTOR=1
set -euo pipefail

cd "$(dirname "$0")/.."

# ── color helpers ────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED=$'\033[0;31m'; GRN=$'\033[0;32m'; YLW=$'\033[0;33m'
  BLU=$'\033[0;34m'; BLD=$'\033[1m'; DIM=$'\033[2m'; RST=$'\033[0m'
else
  RED=""; GRN=""; YLW=""; BLU=""; BLD=""; DIM=""; RST=""
fi

# ── state ────────────────────────────────────────────────────────────────────
declare -a STAGE_NAMES=()
declare -a STAGE_STATUS=()
declare -a STAGE_ELAPSED=()
CURRENT_STAGE=""
OVERALL_START=$(date +%s)

fmt_secs() {
  local s=$1
  if (( s < 60 )); then
    printf '%ds' "$s"
  else
    printf '%dm%02ds' $((s/60)) $((s%60))
  fi
}

print_summary() {
  local overall_end overall_elapsed
  overall_end=$(date +%s)
  overall_elapsed=$((overall_end - OVERALL_START))
  printf '\n%s━━ summary ━━%s\n' "$BLD" "$RST"
  local i
  for i in "${!STAGE_NAMES[@]}"; do
    local mark color
    if [[ "${STAGE_STATUS[$i]}" == "ok" ]]; then
      mark="✓"; color="$GRN"
    elif [[ "${STAGE_STATUS[$i]}" == "skip" ]]; then
      mark="∅"; color="$DIM"
    else
      mark="✗"; color="$RED"
    fi
    printf '  %s%s%s  %-28s %s%s%s\n' \
      "$color" "$mark" "$RST" \
      "${STAGE_NAMES[$i]}" \
      "$DIM" "$(fmt_secs "${STAGE_ELAPSED[$i]}")" "$RST"
  done
  printf '  %stotal%s  %s\n' "$BLD" "$RST" "$(fmt_secs "$overall_elapsed")"
}

on_error() {
  local exit_code=$?
  if [[ -n "$CURRENT_STAGE" ]]; then
    STAGE_STATUS[${#STAGE_STATUS[@]}-1]="fail"
  fi
  print_summary
  printf '\n%s%s✗ FAILED at: %s%s\n' "$BLD" "$RED" "$CURRENT_STAGE" "$RST"
  exit "$exit_code"
}
trap on_error ERR

# ── step runner ──────────────────────────────────────────────────────────────
step() {
  local name="$1"; shift
  CURRENT_STAGE="$name"
  STAGE_NAMES+=("$name")
  STAGE_STATUS+=("pending")
  STAGE_ELAPSED+=(0)
  local idx=$((${#STAGE_NAMES[@]} - 1))
  printf '\n%s━━ %s ━━%s\n' "$BLU" "$name" "$RST"
  local start end elapsed
  start=$(date +%s)
  "$@"
  end=$(date +%s)
  elapsed=$((end - start))
  STAGE_STATUS[$idx]="ok"
  STAGE_ELAPSED[$idx]=$elapsed
  printf '%s✓%s %s %s(%s)%s\n' "$GRN" "$RST" "$name" "$DIM" "$(fmt_secs "$elapsed")" "$RST"
}

skip_step() {
  local name="$1" reason="$2"
  STAGE_NAMES+=("$name")
  STAGE_STATUS+=("skip")
  STAGE_ELAPSED+=(0)
  printf '\n%s━━ %s ━━%s\n' "$BLU" "$name" "$RST"
  printf '%s∅%s skipped (%s)\n' "$YLW" "$RST" "$reason"
}

# ── stage implementations ────────────────────────────────────────────────────
do_install() {
  pnpm install --frozen-lockfile --prefer-offline
}

do_build() {
  pnpm -r build
}

do_typecheck() {
  pnpm -r typecheck
}

do_tests() {
  pnpm test
}

do_ada_help() {
  ada --help > /dev/null
}

do_ada_doctor() {
  ada doctor
}

# ── pipeline ─────────────────────────────────────────────────────────────────
printf '%sada verify pipeline%s  %s(%s)%s\n' "$BLD" "$RST" "$DIM" "$(pwd)" "$RST"

if [[ "${SKIP_INSTALL:-0}" == "1" ]]; then
  skip_step "pnpm install" "SKIP_INSTALL=1"
else
  step "pnpm install" do_install
fi

step "pnpm -r build" do_build
step "pnpm -r typecheck" do_typecheck

if [[ "${SKIP_TESTS:-0}" == "1" ]]; then
  skip_step "pnpm test" "SKIP_TESTS=1"
else
  step "pnpm test" do_tests
fi

step "ada --help smoke" do_ada_help

if [[ "${SKIP_DOCTOR:-0}" == "1" ]]; then
  skip_step "ada doctor" "SKIP_DOCTOR=1"
else
  step "ada doctor" do_ada_doctor
fi

CURRENT_STAGE=""
trap - ERR
print_summary
printf '\n%s%s✓ all stages passed%s\n' "$BLD" "$GRN" "$RST"
