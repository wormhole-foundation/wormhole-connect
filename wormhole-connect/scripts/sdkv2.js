const fs = require('fs');
const path = require('path');

const WORK_ROOT = process.env['WORK_ROOT'];

const thirdPartyPkgs = {
  '@mayanfinance/wormhole-sdk-route': 'wormhole-sdk-route',
  '@wormhole-foundation/sdk-definitions-ntt':
    'example-native-token-transfers/sdk/definitions',
  '@wormhole-foundation/sdk-route-ntt':
    'example-native-token-transfers/sdk/route',
  '@wormhole-foundation/sdk-solana-ntt':
    'example-native-token-transfers/solana',
  '@wormhole-foundation/sdk-evm-ntt': 'example-native-token-transfers/evm/ts',
};

if (!WORK_ROOT) {
  console.error(
    'Please export a WORK_ROOT env var containing the absolute path to a directory containing the following repos:\n- wormhole-sdk-ts\n- example-native-token-transfers',
  );
  process.exit(1);
}

const SDK_PATH = path.join(WORK_ROOT, 'wormhole-sdk-ts');

let sdkPackages = {};

for (let packageName in thirdPartyPkgs) {
  const packageDir = thirdPartyPkgs[packageName];
  sdkPackages[packageName] = path.join(WORK_ROOT, packageDir);
}

const { execSync } = require('child_process');

// This script builds, packs, and installs sdkv2 from a local directory

const sdkPackageJsonPath = path.join(SDK_PATH, './package.json');

// Get SDKv2 version
const { version, workspaces } = JSON.parse(
  fs.readFileSync(sdkPackageJsonPath, 'utf8'),
);

for (const workspace of workspaces) {
  if (workspace.includes('examples')) continue;
  const workspacePackageJson = path.join(SDK_PATH, workspace, 'package.json');
  const { name } = JSON.parse(fs.readFileSync(workspacePackageJson));
  sdkPackages[name] = path.join(SDK_PATH, workspace);
}

const total = Object.keys(sdkPackages).length * 2;
let progress = 0;

for (const name in sdkPackages) {
  if (name.includes('examples')) {
    continue;
  }
  execSync('npm link', { cwd: sdkPackages[name] });
  progress += 1;
  progressBar(progress, total);
}

for (const name in sdkPackages) {
  if (name.includes('examples')) {
    continue;
  }
  linkLocalSdkPackages(sdkPackages[name]);
  progress += 1;
  progressBar(progress, total);
}

execSync(`npm link ${Object.keys(sdkPackages).join(' ')}`, {
  cwd: path.join(__dirname, '../'),
});

function linkLocalSdkPackages(dir) {
  let packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json')));
  let keys = [];

  for (let key in packageJson.dependencies) {
    if (sdkPackages[key] !== undefined) {
      keys.push(key);
    }
  }

  if (keys.length === 0) return;

  execSync(`npm link ${keys.join(' ')}`, { cwd: dir });
}

function progressBar(completed, total) {
  const percentage = Math.round((completed / total) * 100);
  const barLength = 50;
  const filledLength = Math.round((barLength * percentage) / 100);
  const bar = '░'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
  process.stdout.write(`\rLinking... [${bar}] ${percentage}%`);
}
