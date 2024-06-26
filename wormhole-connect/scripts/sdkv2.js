const fs = require('fs');
const path = require('path');

const WORK_ROOT = process.env['WORK_ROOT'];

if (!WORK_ROOT) {
  console.error(
    'Please export a WORK_ROOT env var containing the absolute path to a directory containing the following repos:\n- wormhole-sdk-ts\n- example-native-token-transfers',
  );
  process.exit(1);
}

const SDK_PATH = path.join(WORK_ROOT, 'wormhole-sdk-ts');
const NTT_SDK_PATH = path.join(
  WORK_ROOT,
  'example-native-token-transfers/sdk/definitions',
);

if (!SDK_PATH) throw new Error('Please set SDK_PATH in your environment');

const { execSync } = require('child_process');

// This script builds, packs, and installs sdkv2 from a local directory

const sdkPackageJsonPath = path.join(SDK_PATH, './package.json');

// Get SDKv2 version
const { version, workspaces } = JSON.parse(
  fs.readFileSync(sdkPackageJsonPath, 'utf8'),
);

let sdkPackages = {};

for (const workspace of workspaces) {
  if (workspace.includes('examples')) continue;
  const workspacePackageJson = path.join(SDK_PATH, workspace, 'package.json');
  const { name } = JSON.parse(fs.readFileSync(workspacePackageJson));
  sdkPackages[name] = path.join(SDK_PATH, workspace);

  console.log(`linking ${name}`);
  execSync('npm link', { cwd: sdkPackages[name] });
}

//sdkPackages['@wormhole-foundation/sdk-definitions-ntt'] = NTT_SDK_PATH;

execSync(`npm link ${Object.keys(sdkPackages).join(' ')}`, {
  cwd: path.join(__dirname, '../'),
});

for (const name in sdkPackages) {
  if (name.includes('examples')) {
    continue;
  }
  linkLocalSdkPackages(sdkPackages[name]);
}

function linkLocalSdkPackages(dir) {
  let packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json')));
  packageJson.overrides = packageJson.overrides || {};

  let keys = [];

  for (let key in packageJson.dependencies) {
    if (sdkPackages[key] !== undefined) {
      keys.push(key);
    }
  }

  console.log(`npm link ${keys.join(' ')}`);

  execSync(`npm link ${keys.join(' ')}`, { cwd: dir });
}

execSync(`rm -rf wormhole-connect/node_modules/@wormhole-foundation`);
