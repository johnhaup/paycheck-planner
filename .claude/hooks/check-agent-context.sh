#!/usr/bin/env bash
# Stop hook: a turn that leaves code changes in the working tree may not end until
# docs/AGENT_CONTEXT.md has been updated too. Fires once per turn (stop_hook_active guard).
set -euo pipefail

DOC="docs/AGENT_CONTEXT.md"

input=$(cat)
if [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

changed=$(git status --porcelain --untracked-files=all 2>/dev/null | awk '{print $NF}' | grep -v '^\.claude/worktrees/' || true)
if [ -z "$changed" ]; then
  exit 0
fi

if printf '%s\n' "$changed" | grep -qx "$DOC"; then
  exit 0
fi

# Updating the doc and committing it in the same turn leaves it clean in the tree.
if [ -n "$(git log -1 --since='1 hour ago' --format=%h -- "$DOC" 2>/dev/null)" ]; then
  exit 0
fi

code_changes=$(printf '%s\n' "$changed" | grep -vx "$DOC" || true)
if [ -z "$code_changes" ]; then
  exit 0
fi

jq -n --arg doc "$DOC" --arg files "$code_changes" '{
  decision: "block",
  reason: ("The working tree has changes but " + $doc + " was not updated this turn. Update it before finishing: refresh Current state, add a Recent work entry for what you did, record any lesson or pitfall you hit, and adjust Open follow-ups. If the changes are not yours, add a one-line note under Current state that they are uncommitted in the tree. Changed files:\n" + $files)
}'
