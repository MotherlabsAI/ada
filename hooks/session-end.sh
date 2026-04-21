#!/bin/bash
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
END_REASON=$(echo "$INPUT" | jq -r '.end_reason // "unknown"' 2>/dev/null || echo "unknown")
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-${ADA_PROJECT_DIR:-$(pwd)}}"
SESSIONS_DIR="$PROJECT_DIR/.ada/sessions"
mkdir -p "$SESSIONS_DIR"
TS=$(date +%s)

# Read latest run quality from confidence history
LATEST_CONFIDENCE=""
LATEST_DECISION=""
CONF_HISTORY="$PROJECT_DIR/.ada/confidence-history.jsonl"
if [ -f "$CONF_HISTORY" ]; then
  LAST_LINE=$(tail -n1 "$CONF_HISTORY" 2>/dev/null)
  LATEST_CONFIDENCE=$(echo "$LAST_LINE" | jq -r '.confidence // ""' 2>/dev/null || echo "")
  LATEST_DECISION=$(echo "$LAST_LINE" | jq -r '.decision // ""' 2>/dev/null || echo "")
fi

cat > "$SESSIONS_DIR/${SESSION_ID}.json" <<EOF
{"sessionId":"$SESSION_ID","endReason":"$END_REASON","completedAt":$TS,"latestConfidence":"$LATEST_CONFIDENCE","latestDecision":"$LATEST_DECISION"}
EOF
exit 0
