#!/bin/bash
# Keep one verified compressed rollback instead of a second 13+ GiB .next tree.
set -euo pipefail
cd "${DEPLOY_DIR:-/var/www/school-portal}"

[[ -d .next-previous && ! -L .next-previous ]] || exit 0
old_id=$(cat .next-previous/BUILD_ID)
[[ "$old_id" =~ ^[a-zA-Z0-9_-]+$ ]]
archive=".next-rollback-$old_id.tar.zst"
temp="$archive.tmp.$$"
trap '[[ ! -e "$temp" ]] || rm -- "$temp"' EXIT

# Runtime caches are regenerated. Preserve the actual release for rollback.
tar -C .next-previous --exclude='./cache' --exclude='./dev' -cf - . | zstd -T2 -3 -o "$temp"
zstd -t "$temp"
[[ "$(tar --zstd -xOf "$temp" ./BUILD_ID)" == "$old_id" ]]
mv -- "$temp" "$archive"
rm -r -- .next-previous

for older in .next-rollback-*.tar.zst; do
  [[ -f "$older" && "$older" != "$archive" ]] && rm -- "$older"
done
[[ ! -f .next-release.tar.zst ]] || rm -- .next-release.tar.zst
echo "Rollback packed: $archive"
