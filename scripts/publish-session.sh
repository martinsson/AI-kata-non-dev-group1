#!/usr/bin/env bash
#
# publish-session.sh — close out a workshop session.
#
# For each group repo it:
#   1. fetches and snapshots site/ from the group's main into the portfolio repo
#      under <date>/<group>/ (the published, decoupled copy)
#   2. captures a preview.png of each app (screenshot-portfolio.sh)
#   3. adds a card section to the portfolio's index.html — UNLESS a section for
#      this date already exists (so hand-curated cards are never clobbered)
#   4. commits & pushes the portfolio repo
# Then, unless --no-reset, it chains into reset-workshop.sh to preserve each
# group's work behind the session tag and rewind their main to the start point.
# (The reset is reversible: it only creates a tag + force-rewinds main.)
#
# Usage:
#   scripts/publish-session.sh [<session-date>] [options]
#     <session-date>   YYYY-MM-DD, default: today
#
# Options:
#   --portfolio <dir>   portfolio repo (default: ../business-people-coding)
#   --remotes "a b c"   group remotes (default: group1 group2 group3 group4 group5)
#   --no-shots          skip screenshots
#   --no-reset          publish only; do NOT reset the group repos afterwards
#   --no-push           do everything locally but don't push the portfolio
#   -n, --dry-run       print what would happen, change nothing
#   -y, --yes           skip confirmation prompts (also passed to the reset)
#   -h, --help          show this help

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT_DIR="$REPO_ROOT/scripts"

SESSION_DATE=""
PORTFOLIO="$(dirname "$REPO_ROOT")/business-people-coding"
REMOTES="group1 group2 group3 group4 group5"
DO_SHOTS=1; DO_RESET=1; DO_PUSH=1; DRY_RUN=0; ASSUME_YES=0

usage() { sed -n '2,/^set -euo/p' "$0" | sed 's/^# \{0,1\}//; s/^#$//' | sed '$d'; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --portfolio) PORTFOLIO="$2"; shift 2 ;;
    --remotes)   REMOTES="$2"; shift 2 ;;
    --no-shots)  DO_SHOTS=0; shift ;;
    --no-reset)  DO_RESET=0; shift ;;
    --no-push)   DO_PUSH=0; shift ;;
    -n|--dry-run) DRY_RUN=1; shift ;;
    -y|--yes)     ASSUME_YES=1; shift ;;
    -h|--help)    usage; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *)  if [[ -z "$SESSION_DATE" ]]; then SESSION_DATE="$1"; shift
        else echo "Unexpected argument: $1" >&2; exit 2; fi ;;
  esac
done

[[ -z "$SESSION_DATE" ]] && SESSION_DATE="$(date +%F)"
[[ "$SESSION_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "ERROR: session date must be YYYY-MM-DD" >&2; exit 2; }
SESSION_TAG="session-$SESSION_DATE"

if [[ ! -d "$PORTFOLIO/.git" ]]; then
  echo "ERROR: portfolio repo not found at: $PORTFOLIO  (use --portfolio)" >&2; exit 1
fi
INDEX="$PORTFOLIO/index.html"

run() { if [[ $DRY_RUN -eq 1 ]]; then echo "  [dry-run] $*"; else echo "  + $*"; eval "$@"; fi; }

echo "Publish session"
echo "  date / tag : $SESSION_DATE  ($SESSION_TAG)"
echo "  portfolio  : $PORTFOLIO"
echo "  remotes    : $REMOTES"
echo "  steps      : snapshot$([[ $DO_SHOTS = 1 ]] && echo ' + shots') + index$([[ $DO_PUSH = 1 ]] && echo ' + push')$([[ $DO_RESET = 1 ]] && echo ' + reset')"
[[ $DRY_RUN -eq 1 ]] && echo "  mode       : DRY RUN"
echo

if [[ $DRY_RUN -eq 0 && $ASSUME_YES -eq 0 ]]; then
  read -r -p "Proceed? [y/N] " reply; [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
  echo
fi

# 1. snapshot each group's site/ into the portfolio --------------------------
shot_entries=()
for remote in $REMOTES; do
  echo "== $remote =="
  git remote get-url "$remote" >/dev/null 2>&1 || { echo "  ! no such remote, skipping" >&2; continue; }
  run "git fetch --quiet $remote"
  dest="$PORTFOLIO/$SESSION_DATE/$remote"
  if git ls-tree --name-only "$remote/main" site/ 2>/dev/null | grep -q .; then
    run "mkdir -p '$dest'"
    run "git archive '$remote/main' site | tar -x --strip-components=1 -C '$dest'"
    shot_entries+=("$SESSION_DATE/$remote")
  else
    echo "  ! no site/ on $remote/main, skipping snapshot" >&2
  fi
  echo
done

# 2. previews -----------------------------------------------------------------
if [[ $DO_SHOTS -eq 1 && ${#shot_entries[@]} -gt 0 && $DRY_RUN -eq 0 ]]; then
  echo "== previews =="
  "$SCRIPT_DIR/screenshot-portfolio.sh" "$PORTFOLIO" "${shot_entries[@]}" || echo "  ! screenshots failed (continuing)"
  echo
elif [[ $DO_SHOTS -eq 1 && $DRY_RUN -eq 1 ]]; then
  echo "  [dry-run] screenshot-portfolio.sh $PORTFOLIO ${shot_entries[*]}"; echo
fi

# 3. index cards (only if no section exists for this date) --------------------
if grep -q "$SESSION_TAG" "$INDEX" 2>/dev/null || grep -q "$SESSION_DATE/" "$INDEX" 2>/dev/null; then
  echo "== index =="
  echo "  section for $SESSION_DATE already present in index.html — leaving cards as-is."
  echo
else
  echo "== index (generating stub cards — edit descriptions afterwards) =="
  # soft gradient palette per group (matches the hand-curated sessions)
  c1=(_ "#ffe9d6" "#d6f0ff" "#e2dcff" "#d8f5e6" "#e8f5d6")
  c2=(_ "#ffd0a8" "#a8d8f5" "#c2b6f5" "#aee6c8" "#cce8a8")
  cards=""
  for remote in $REMOTES; do
    [[ -d "$PORTFOLIO/$SESSION_DATE/$remote" ]] || continue
    n="${remote#group}"
    title="$(sed -n 's:.*<title>\(.*\)</title>.*:\1:p' "$PORTFOLIO/$SESSION_DATE/$remote/index.html" 2>/dev/null | head -1)"
    [[ -z "$title" ]] && title="Groupe $n"
    slug="$(printf '%s' "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
    [[ -z "$slug" ]] && slug="$remote"
    ci=$(( (n - 1) % 5 + 1 ))
    # Browser-framed card carrying data-fr/data-en so the index.html toggle keeps
    # new sessions bilingual. The h3 (app/brand name) is identical in both languages.
    cards+="      <a class=\"card\" href=\"$SESSION_DATE/$remote/\" style=\"--c1:${c1[$ci]};--c2:${c2[$ci]}\">
        <div class=\"frame\"><div class=\"bar\"><i></i><i></i><i></i><span class=\"url\">$slug</span></div>
          <div class=\"shot\"><span class=\"emoji\">📦</span><img src=\"$SESSION_DATE/$remote/preview.png\" alt=\"\" loading=\"lazy\"></div></div>
        <div class=\"meta\"><span class=\"who\" data-fr=\"Groupe $n\" data-en=\"Group $n\">Groupe $n</span><h3>$title</h3>
          <p data-fr=\"Décrivez l'appli ici.\" data-en=\"Describe the app here.\">Décrivez l'appli ici.</p></div>
      </a>
"
  done
  human_fr="$(LC_ALL=fr_FR.UTF-8 date -j -f %F "$SESSION_DATE" +'%-d %B %Y' 2>/dev/null || echo "$SESSION_DATE")"
  human_en="$(LC_ALL=en_US.UTF-8 date -j -f %F "$SESSION_DATE" +'%-d %B %Y' 2>/dev/null || echo "$SESSION_DATE")"
  section="
  <section>
    <div class=\"sec-head\"><h2 data-fr=\"Session du $human_fr\" data-en=\"Session of $human_en\">Session du $human_fr</h2><span class=\"tag\">tag <code>$SESSION_TAG</code></span></div>
    <div class=\"grid\">
$cards    </div>
  </section>
"
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "  [dry-run] would insert a section for $SESSION_DATE into index.html"
  else
    MARKER="publish-session.sh insère" SECTION="$section" python3 - "$INDEX" <<'PY'
import os, sys
path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    html = f.read()
marker, section = os.environ["MARKER"], os.environ["SECTION"]
for line in html.splitlines(keepends=True):
    if marker in line:
        html = html.replace(line, line + section, 1)
        break
else:
    html = html.replace("<main>", "<main>\n" + section, 1)
with open(path, "w", encoding="utf-8") as f:
    f.write(html)
print("  inserted stub section for", os.path.basename(path))
PY
  fi
  echo
fi

# 4. commit & push the portfolio ---------------------------------------------
echo "== portfolio repo =="
if [[ $DRY_RUN -eq 1 ]]; then
  echo "  [dry-run] git -C '$PORTFOLIO' add -A && commit && push"
else
  git -C "$PORTFOLIO" add -A
  if git -C "$PORTFOLIO" diff --cached --quiet; then
    echo "  nothing to commit."
  else
    git -C "$PORTFOLIO" commit -q -m "Add session $SESSION_DATE to the portfolio"
    echo "  committed."
    [[ $DO_PUSH -eq 1 ]] && { git -C "$PORTFOLIO" push -q && echo "  pushed."; } || echo "  (push skipped)"
  fi
fi
echo

# 5. reset the group repos (chained, reversible) ------------------------------
if [[ $DO_RESET -eq 1 ]]; then
  echo "== reset =="
  reset_args=("$SESSION_TAG" --remotes "$REMOTES")
  [[ $DRY_RUN -eq 1 ]]   && reset_args+=(--dry-run)
  [[ $ASSUME_YES -eq 1 ]] && reset_args+=(--yes)
  "$SCRIPT_DIR/reset-workshop.sh" "${reset_args[@]}"
else
  echo "(reset skipped — run scripts/reset-workshop.sh $SESSION_TAG when ready)"
fi

echo
echo "Published session $SESSION_DATE → $PORTFOLIO"
