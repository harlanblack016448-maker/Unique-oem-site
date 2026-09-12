#!/usr/bin/env bash
# --check-only is strictly read-only. --publish requires already reviewed, matching copies.
set -euo pipefail
export GIT_OPTIONAL_LOCKS=0
SITE_DIR="${OEM_SITE_DIR:-/Users/harlan/Workbuddy/2026-08-10-14-49-50/oem-landing}"
PUSH_DIR="${OEM_PUSH_DIR:-/Users/harlan/Workbuddy/2026-08-10-14-49-50/oem-site-git}"
MODE="${1:---check-only}"
if [[ "$MODE" != --check-only && "$MODE" != --publish ]]; then
  echo 'Usage: prepush.sh --check-only | --publish "commit message"' >&2
  exit 2
fi
if [[ "$MODE" == --publish && -z "${2:-}" ]]; then
  echo 'A commit message is required.' >&2; exit 2
fi
EXPECTED_REMOTE='https://github.com/harlanblack016448-maker/Unique-oem-site'
BRANCH=$(git -C "$PUSH_DIR" symbolic-ref --short HEAD)
[[ "$BRANCH" == main ]] || { echo 'Push clone must be on main.' >&2; exit 1; }
REMOTE=$(git -C "$PUSH_DIR" remote get-url origin)
[[ "${REMOTE%.git}" == "$EXPECTED_REMOTE" ]] || { echo 'Unexpected origin; stopped.' >&2; exit 1; }
[[ ! -f "$PUSH_DIR/.git/index.lock" ]] || { echo 'Git index is locked; wait for the other Git operation.' >&2; exit 1; }
# Do not repair markup, fetch, merge, synchronize, stage or delete in check mode.
if command -v rg >/dev/null 2>&1; then
  if rg -n 'data-page-node-id=' "$SITE_DIR" "$PUSH_DIR" --glob '*.html'; then
    echo 'Editor markup found. Review and remove it explicitly before release.' >&2; exit 1
  else
    result=$?; [[ "$result" == 1 ]] || exit "$result"
  fi
else
  if grep -R -n --include='*.html' 'data-page-node-id=' "$SITE_DIR" "$PUSH_DIR"; then
    echo 'Editor markup found. Review and remove it explicitly before release.' >&2; exit 1
  else
    result=$?; [[ "$result" == 1 ]] || exit "$result"
  fi
fi
DIFF=$(rsync -rcn --delete --itemize-changes --exclude='.git/' --exclude='.DS_Store' --exclude='__pycache__/' "$SITE_DIR/" "$PUSH_DIR/")
if [[ -n "$DIFF" ]]; then
  echo "$DIFF"
  echo 'Source and push clone differ. Review the differences; this script will not overwrite either copy.' >&2
  exit 1
fi
git -C "$PUSH_DIR" diff --check
git -C "$PUSH_DIR" diff --cached --check
echo 'Reviewed-copy status:'
git -C "$PUSH_DIR" status --short
if [[ "$MODE" == --check-only ]]; then
  echo 'Read-only checks passed. No files, index, refs or remote state changed.'
  exit 0
fi
# Publication is an explicit action, never an implication of running checks.
REMOTE_HEAD=$(git -C "$PUSH_DIR" ls-remote origin refs/heads/main | awk '{print $1}')
LOCAL_HEAD=$(git -C "$PUSH_DIR" rev-parse HEAD)
[[ "$REMOTE_HEAD" == "$LOCAL_HEAD" ]] || { echo 'Remote main and local HEAD differ. Review and reconcile before publishing.' >&2; exit 1; }
# Require every file to be tracked or intentionally staged. No blanket git add.
[[ -z "$(git -C "$PUSH_DIR" ls-files --others --exclude-standard)" ]] || { echo 'Untracked files found. Review and stage intended files explicitly.' >&2; exit 1; }
git -C "$PUSH_DIR" diff --quiet || { echo 'Unstaged changes found. Review and stage them explicitly.' >&2; exit 1; }
git -C "$PUSH_DIR" diff --cached --quiet && { echo 'No staged changes to publish.'; exit 0; }
(cd "$PUSH_DIR" && PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v && node --test tests/*.test.cjs && node --check assets/i18n.js && node --check assets/form.js && node --check assets/inquiry-request.js && node --check assets/partials.js)
git -C "$PUSH_DIR" diff --cached --stat
git -C "$PUSH_DIR" commit -m "$2"
git -C "$PUSH_DIR" push origin HEAD:main
echo 'GitHub push completed. Vercel deployment and browser verification are separate remaining steps.'
