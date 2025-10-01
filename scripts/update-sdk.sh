#!/bin/bash

# Update SDK Packages
# Updates all Wormhole SDK packages to the specified version (if provided), creates a new branch,
# and commits the changes with a predefined commit message. If no version is provided, the latest version
# of @wormhole-foundation/sdk will be used from npm.

# pnpm sdk:update
# → Finds latest SDK version (X.Y.Z)
# → Creates branch update-sdk-X.Y.Z

# pnpm sdk:update 3.4.5
# → Uses version 3.4.5
# → Creates branch update-sdk-3.4.5

# pnpm sdk:update 3.4.5 PROD-123
# → Uses version 3.4.5
# → Creates branch PROD-123

# pnpm sdk:update PROD-123 (not semver)
# → Grabs latest SDK version
# → Creates branch PROD-123

PORTAL_ROOT="$(dirname "$(dirname "$(realpath "$0")")")"
cd "$PORTAL_ROOT"

# Simple regex for semver (X.Y.Z, optionally with prerelease/build tags)
SEMVER_REGEX="^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$"

# If no args → grab latest version, default branch naming
if [ -z "$1" ]; then
  echo "⚠️  No version or ticket provided. Finding most recent @wormhole-foundation/sdk version..."
  VERSION=$(npm view @wormhole-foundation/sdk version)
  BRANCH_NAME="update-sdk-$VERSION"
  echo "✅ Using latest version: $VERSION"
else
  if [[ "$1" =~ $SEMVER_REGEX ]]; then
    # First arg is a version
    VERSION="$1"
    BRANCH_NAME="${2:-update-sdk-$VERSION}"
  else
    # First arg is not a semver → treat as ticket
    VERSION=$(npm view @wormhole-foundation/sdk version)
    BRANCH_NAME="$1"
    echo "⚠️  First argument '$1' is not a version. Using latest SDK version: $VERSION"
  fi
fi

git checkout main
git pull origin main
git branch -D "$BRANCH_NAME" 2>/dev/null
git checkout -b "$BRANCH_NAME"

# Update all SDK packages to the new version
pnpm add \
  @wormhole-foundation/sdk@"$VERSION" \
  @wormhole-foundation/sdk-aptos@"$VERSION" \
  @wormhole-foundation/sdk-aptos-core@"$VERSION" \
  @wormhole-foundation/sdk-base@"$VERSION" \
  @wormhole-foundation/sdk-connect@"$VERSION" \
  @wormhole-foundation/sdk-definitions@"$VERSION" \
  @wormhole-foundation/sdk-evm@"$VERSION" \
  @wormhole-foundation/sdk-evm-core@"$VERSION" \
  @wormhole-foundation/sdk-icons@"$VERSION" \
  @wormhole-foundation/sdk-solana@"$VERSION" \
  @wormhole-foundation/sdk-solana-cctp@"$VERSION" \
  @wormhole-foundation/sdk-solana-core@"$VERSION" \
  @wormhole-foundation/sdk-sui@"$VERSION" \
  @wormhole-foundation/sdk-sui-cctp@"$VERSION" \
  @wormhole-foundation/sdk-sui-core@"$VERSION"

# Update overrides in package.json if present
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = '$VERSION';

// Update npm overrides (not pnpm)
if (pkg.overrides) {
  const updateOverrides = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        // Recursively update nested overrides
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (nestedKey.startsWith('@wormhole-foundation/sdk') && !nestedKey.includes('-ntt')) {
            value[nestedKey] = version;
          }
        }
      } else if (key.startsWith('@wormhole-foundation/sdk') && !key.includes('-ntt')) {
        obj[key] = version;
      }
    }
  };

  updateOverrides(pkg.overrides);
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Install to update lockfile
pnpm install

git add .
git commit -m "chore: update SDK packages to $VERSION"

echo "✅ SDK update complete. Branch '$BRANCH_NAME' created with SDK version $VERSION."
