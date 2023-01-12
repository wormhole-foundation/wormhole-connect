#!/bin/bash

# Stash uncommitted changes
git stash push --keep-index

abort()
{
  echo_abort
  echo "An error occurred. Please review your code and try again" >&2
  git stash pop
  exit 1
}

trap 'abort' 0

set -e
git update-index -q --refresh

# Do things here
# ====================================

# lint
npm run lint
git add .

# ====================================

trap : 0

echo >&2 '
************
*** DONE ***
************
'

git stash pop -q
