#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."

if grep -rliE --include='*.tsx' 'type=["\x27]tel|/api/leads/submit|formspree\.io|api\.school\.(synergy|syndev)\.ru' src/app src/components; then
  echo "ProSchools is informational. Public templates must not collect or send leads."
  exit 1
fi
echo "No lead capture in public templates"
