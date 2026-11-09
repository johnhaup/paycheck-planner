#!/usr/bin/env bash
# Stop hook, canonical copy (linear-runner/v2/contract). Every app repo carries this file
# byte-identical at .claude/hooks/check-agent-context.sh.
#
# 1. A turn that leaves code changes in the working tree may not end until a handoff note under
#    docs/handoff/ has been written or updated. One note per ticket, so two open pull requests
#    never edit the same handoff lines and never conflict over them.
# 2. docs/AGENT_CONTEXT.md is loaded into every request, so it has a size cap.
# Fires once per turn (stop_hook_active guard).
set -euo pipefail

DOC="docs/AGENT_CONTEXT.md"
NOTES="docs/handoff"
ARCHIVE="docs/AGENT_CONTEXT_ARCHIVE.md"
LESSONS="docs/AGENT_LESSONS.md"
MAX_LINES=160

input=$(cat)
if [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

changed=$(git status --porcelain --untracked-files=all 2>/dev/null | awk '{print $NF}' | grep -v '^\.claude/worktrees/' || true)

# True when the path is dirty in the tree or was committed in the last hour.
touched() {
  if printf '%s\n' "$changed" | grep -q "^$1"; then return 0; fi
  [ -n "$(git log -1 --since='1 hour ago' --format=%h -- "$1" 2>/dev/null)" ]
}

# Size cap: only enforced on a turn that touched the doc, so a read-only session is never blocked.
if touched "$DOC" && [ -f "$DOC" ]; then
  lines=$(wc -l < "$DOC" | tr -d ' ')
  if [ "$lines" -gt "$MAX_LINES" ]; then
    jq -n --arg doc "$DOC" --arg notes "$NOTES" --arg n "$lines" --arg max "$MAX_LINES" '{
      decision: "block",
      reason: ($doc + " is " + $n + " lines; the cap is " + $max + " because it is loaded into every request. It holds only what is true today. Move anything that describes work done into your note under " + $notes + "/ and fold the rest down. Nothing is deleted, only moved.")
    }'
    exit 0
  fi
fi

if [ -z "$changed" ] || touched "$NOTES/"; then
  exit 0
fi

code_changes=$(printf '%s\n' "$changed" | grep -vx "$DOC" | grep -vx "$ARCHIVE" | grep -vx "$LESSONS" || true)
if [ -z "$code_changes" ]; then
  exit 0
fi

jq -n --arg doc "$DOC" --arg notes "$NOTES" --arg files "$code_changes" '{
  decision: "block",
  reason: ("The working tree has changes but no handoff note was written this turn. Write or update " + $notes + "/<YYYY-MM-DD>-<ticket or branch slug>.md (one note per ticket; if this branch already has one, update it): what changed and why, how it was verified, follow-ups, and any lesson or pitfall. Do not add entries to " + $doc + "; change it only where a line is no longer true. If the changes are not yours, write no note and end the turn. Changed files:\n" + $files)
}'
