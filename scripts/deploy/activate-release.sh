#!/bin/bash
set -euo pipefail
expected="$1"
[[ "$expected" =~ ^[a-zA-Z0-9_-]+$ ]]
# Retrying after SSH disconnect must not swap directories twice.
if [[ "$(cat .next/BUILD_ID 2>/dev/null)" == "$expected" ]] && [[ ! -d .next-incoming ]]; then
  pm2 restart school-portal --update-env
  exit 0
fi
[[ "$(cat .next-incoming/BUILD_ID)" == "$expected" ]]
[[ ! -L .next && ! -L .next-incoming && ! -L .next-previous ]]
# Only the previous release backup is replaceable; never remove the live build.
rm -rf .next-previous
stopped=0
moved=0
rollback() {
  rc=$?
  trap - EXIT
  if [[ "$rc" != 0 && "$stopped" == 1 ]]; then
    pm2 stop school-portal || true
    if [[ "$moved" == 1 ]]; then
      if [[ -d .next ]]; then mv .next .next-incoming; fi
      mv .next-previous .next
    fi
    pm2 restart school-portal --update-env || true
    echo 'Activation failed; previous build restored' >&2
  fi
  exit "$rc"
}
trap rollback EXIT
trap 'exit 1' HUP INT TERM
pm2 stop school-portal
stopped=1
mv .next .next-previous
moved=1
mv .next-incoming .next
pm2 restart school-portal --update-env
healthy=0
for attempt in {1..20}; do
  if curl -fsS --max-time 5 http://127.0.0.1:3001/gdz/9-klass/fizika/peryshkin/nomer-p65-2/ -o /dev/null; then healthy=1; break; fi
  sleep 1
done
[[ "$healthy" == 1 ]]
