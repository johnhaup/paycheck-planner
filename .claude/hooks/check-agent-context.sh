#!/usr/bin/env bash
# Stop hook, canonical copy (linear-runner/v2/contract). Every app repo carries this file
# byte-identical at .claude/hooks/check-agent-context.sh.
#
# 1. A turn that leaves code changes in the working tree may not end until
#    docs/AGENT_CONTEXT.md has been updated too.
# 2. The handoff doc is loaded into every request, so it has a size cap. Over the cap, the
#    turn may not end until the oldest Recent work entries are moved to the archive.
#    Lessons live in docs/AGENT_LESSONS.md, which is not loaded and has no cap.
# Fires once per turn (stop_hook_active guard).
set -euo pipefail

DOC="docs/AGENT_CONTEXT.md"
ARCHIVE="docs/AGENT_CONTEXT_ARCHIVE.md"
LESSONS="docs/AGENT_LESSONS.md"
MAX_LINES=160

input=$(cat)
if [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

changed=$(git status --porcelain --untracked-files=all 2>/dev/null | awk '{print $NF}' | grep -v '^\.claude/worktrees/' || true)

# Size cap: only enforced on a turn that touched the doc, so a read-only session is never blocked.
doc_touched=false
if printf '%s\n' "$changed" | grep -qx "$DOC"; then doc_touched=true; fi
if [ -n "$(git log -1 --since='1 hour ago' --format=%h -- "$DOC" 2>/dev/null)" ]; then doc_touched=true; fi
if [ "$doc_touched" = true ] && [ -f "$DOC" ]; then
  lines=$(wc -l < "$DOC" | tr -d ' ')
  if [ "$lines" -gt "$MAX_LINES" ]; then
    jq -n --arg doc "$DOC" --arg arch "$ARCHIVE" --arg les "$LESSONS" --arg n "$lines" --arg max "$MAX_LINES" '{
      decision: "block",
      reason: ($doc + " is " + $n + " lines; the cap is " + $max + " because it is loaded into every request. Move the oldest Recent work entries verbatim to " + $arch + " (newest first), move any lesson to " + $les + ", and fold Current state down to what is true today. Nothing is deleted, only moved. Commit the files together.")
    }'
    exit 0
  fi
fi

if [ -z "$changed" ]; then
  exit 0
fi
if [ "$doc_touched" = true ]; then
  exit 0
fi

code_changes=$(printf '%s\n' "$changed" | grep -vx "$DOC" | grep -vx "$ARCHIVE" | grep -vx "$LESSONS" || true)
if [ -z "$code_changes" ]; then
  exit 0
fi

jq -n --arg doc "$DOC" --arg files "$code_changes" '{
  decision: "block",
  reason: ("The working tree has changes but " + $doc + " was not updated this turn. Update it before finishing: refresh Current state, add a Recent work entry for what you did, adjust Open follow-ups, and record any lesson or pitfall you hit in docs/AGENT_LESSONS.md. If the changes are not yours, add a one-line note under Current state that they are uncommitted in the tree. Changed files:\n" + $files)
}'
