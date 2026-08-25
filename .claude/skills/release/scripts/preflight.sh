#!/usr/bin/env bash
# JobScan release preflight — every gate that must pass before a push.
#
# There is no CI in this repository (.github/workflows does not exist), so this
# script is the CI. Exit 0 means all gates are green; exit 1 means at least one
# failed and its output is printed under it.
#
#   bash .claude/skills/release/scripts/preflight.sh

set -uo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd) || exit 1
cd "$root" || exit 1

fail=0
pass() { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; fail=1; }
note() { printf '  --    %s\n' "$1"; }
show() { sed 's/^/          /' <<<"$1"; }

run() { # run <label> <command...>
  local label=$1; shift
  local out
  if out=$("$@" 2>&1); then pass "$label"; else bad "$label"; show "$out"; fi
}

printf '\nJobScan preflight — %s\n\n' "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'not a git repo')"

# 1-2. Plugin and marketplace manifests.
if command -v claude >/dev/null 2>&1; then
  run "plugin manifest    claude plugin validate ./plugins/jobscan" claude plugin validate ./plugins/jobscan
  run "marketplace        claude plugin validate ." claude plugin validate .
else
  bad "plugin manifest    'claude' not on PATH — both validators are required before a push"
fi

# 3. The 44-question invariant from CLAUDE.md.
out=$(python3 - <<'PY' 2>&1
import re, sys
sq = open("plugins/jobscan/skills/jobscan-onboarding/references/intake-questionnaire.md").read().split("## A. Identity")[1]
dq = open("docs/INTERVIEW-QUESTIONS.md").read().split("# The questions")[1]
cv_src = set(int(m) for m in re.findall(r'^(\d+)\. `\[CV\]`', sq, re.M))
cv_doc = set(int(m) for m in re.findall(r'^(\d+)\. ✓', dq, re.M))
if cv_src != cv_doc:
    print("out of sync — symmetric difference:", sorted(cv_src ^ cv_doc))
    print("[CV] tags in intake-questionnaire.md:", len(cv_src))
    print("checkmarks in INTERVIEW-QUESTIONS.md:", len(cv_doc))
    sys.exit(1)
print(len(cv_src))
PY
)
if [ $? -eq 0 ]; then pass "44-question inv.  in sync, ${out} [CV] tags"; else bad "44-question inv."; show "$out"; fi

# 4. Triage unit tests.
run "triage tests      node scripts/test-triage.mjs" node plugins/jobscan/scripts/test-triage.mjs

# 5. Every pipeline script parses.
bads=""
for f in plugins/jobscan/scripts/*.mjs; do
  node --check "$f" >/dev/null 2>&1 || bads="$bads $(basename "$f")"
done
if [ -z "$bads" ]; then pass "scripts parse     $(ls plugins/jobscan/scripts/*.mjs | wc -l | tr -d ' ') files"
else bad "scripts parse    syntax errors in:$bads"; fi

# 6. The two entry points still run. Both are read-only and always exit 0.
run "paths.mjs runs" node plugins/jobscan/scripts/paths.mjs
run "doctor.mjs runs" node plugins/jobscan/scripts/doctor.mjs

# 7. plugin.json is the only version string, and CHANGELOG.md documents it.
out=$(python3 - <<'PY' 2>&1
import json, re, sys
p = json.load(open("plugins/jobscan/.claude-plugin/plugin.json"))
v = p.get("version")
problems = []
if not v:
    problems.append("plugin.json has no version")
elif not re.search(r'^## \[' + re.escape(v) + r'\]', open("CHANGELOG.md").read(), re.M):
    problems.append(f"plugin.json says {v} but CHANGELOG.md has no '## [{v}]' section")
m = json.load(open(".claude-plugin/marketplace.json"))
if "version" in m or any("version" in e for e in m.get("plugins", [])):
    problems.append("marketplace.json carries a version — it deliberately must not, so the two cannot drift")
skills = p.get("skills", [])
import os
for s in skills:
    if not os.path.isdir(os.path.join("plugins/jobscan", s)):
        problems.append(f"plugin.json lists skill {s} but that directory does not exist")
if problems:
    print("\n".join(problems)); sys.exit(1)
print(f"{v}, {len(skills)} skills, CHANGELOG section present")
PY
)
if [ $? -eq 0 ]; then pass "version           ${out}"; else bad "version"; show "$out"; fi

# Informational: not a gate, since preflight runs before the commit.
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
[ "$dirty" = "0" ] && note "working tree      clean" || note "working tree      ${dirty} uncommitted change(s)"

echo
if [ "$fail" -eq 0 ]; then
  echo "All gates green."
else
  echo "At least one gate failed. Do not push, and do not describe verification as passing."
fi
exit "$fail"
