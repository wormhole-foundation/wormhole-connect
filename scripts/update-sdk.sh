#!/bin/bash

# Update SDK Packages
# Updates all Wormhole SDK packages to the specified version (if provided), creates a new branch,
# and commits the changes with a predefined commit message. If no version is provided, the latest version
# of @wormhole-foundation/sdk will be used from npm.

# npm run sdk:update
# → Finds latest SDK version (X.Y.Z)
# → Creates branch update-sdk-X.Y.Z

# npm run sdk:update 3.4.5
# → Uses version 3.4.5
# → Creates branch update-sdk-3.4.5

# npm run sdk:update 3.4.5 PROD-123
# → Uses version 3.4.5
# → Creates branch PROD-123

# npm run sdk:update PROD-123 (not semver)
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

git checkout development
git pull origin development
git branch -D "$BRANCH_NAME" 2>/dev/null
git checkout -b "$BRANCH_NAME"

# Update dependencies and overrides in package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = '$VERSION';

// SDK packages to update in dependencies
const sdkPackages = [
  '@wormhole-foundation/sdk',
  '@wormhole-foundation/sdk-aptos',
  '@wormhole-foundation/sdk-aptos-core',
  '@wormhole-foundation/sdk-base',
  '@wormhole-foundation/sdk-connect',
  '@wormhole-foundation/sdk-definitions',
  '@wormhole-foundation/sdk-evm',
  '@wormhole-foundation/sdk-evm-core',
  '@wormhole-foundation/sdk-icons',
  '@wormhole-foundation/sdk-solana',
  '@wormhole-foundation/sdk-solana-cctp',
  '@wormhole-foundation/sdk-solana-core',
  '@wormhole-foundation/sdk-stacks',
  '@wormhole-foundation/sdk-stacks-core',
  '@wormhole-foundation/sdk-sui',
  '@wormhole-foundation/sdk-sui-cctp',
  '@wormhole-foundation/sdk-sui-core',
];

// Update dependencies
sdkPackages.forEach(pkg_name => {
  if (pkg.dependencies && pkg.dependencies[pkg_name]) {
    pkg.dependencies[pkg_name] = version;
  }
});

// Update npm overrides
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

# Install to update lockfile with new versions
npm install

git add .
git commit -m "chore: update SDK packages to $VERSION"

echo "✅ SDK update complete. Branch '$BRANCH_NAME' created with SDK version $VERSION."
