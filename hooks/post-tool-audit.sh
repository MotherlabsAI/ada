#!/bin/bash
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null || echo "")
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-${ADA_PROJECT_DIR:-$(pwd)}}"
LOG_FILE="$PROJECT_DIR/.ada/session-log.jsonl"
mkdir -p "$PROJECT_DIR/.ada"
case "$TOOL_NAME" in
  Write|Edit|MultiEdit) PATH_HINT=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null || echo "") ;;
  Bash) PATH_HINT=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null | cut -c1-80 || echo "") ;;
  Read) PATH_HINT=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "") ;;
  *) PATH_HINT="" ;;
esac
TS=$(date +%s)
printf '{"ts":%d,"session":"%s","tool":"%s","path":"%s"}\n' "$TS" "$SESSION_ID" "$TOOL_NAME" "$PATH_HINT" >> "$LOG_FILE"
exit 0