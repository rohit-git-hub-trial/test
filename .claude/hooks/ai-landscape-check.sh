#!/bin/bash
# SessionStart hook: flags whether AI_LANDSCAPE_UPDATES.md needs a daily refresh.
set -euo pipefail

REPORT="$CLAUDE_PROJECT_DIR/AI_LANDSCAPE_UPDATES.md"
TODAY="$(date +%F)"

LAST_REFRESHED=""
if [ -f "$REPORT" ]; then
  LAST_REFRESHED="$(grep -m1 -oE '_Last refreshed: [0-9]{4}-[0-9]{2}-[0-9]{2}_' "$REPORT" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)"
fi

if [ "$LAST_REFRESHED" = "$TODAY" ]; then
  CONTEXT="AI_LANDSCAPE_UPDATES.md is already up to date for today ($TODAY). If the user asks about recent AI tools/updates, read that file and summarize it instead of re-researching."
else
  CONTEXT="AI_LANDSCAPE_UPDATES.md was last refreshed on '${LAST_REFRESHED:-never}', not today ($TODAY). At the start of this session, proactively invoke the ai-landscape-tracker subagent (Agent tool, subagent_type=ai-landscape-tracker) to research current AI tools/model releases and rewrite AI_LANDSCAPE_UPDATES.md, then give the user a short summary of what changed plus what's ongoing and upcoming, with usage instructions."
fi

printf '{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": %s}}' \
  "$(printf '%s' "$CONTEXT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')"
