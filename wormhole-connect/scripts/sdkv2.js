const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

const SDK_PATH = process.env['SDK_PATH'];

if (!SDK_PATH) throw new Error('Please set SDK_PATH in your environment');

const { execSync } = require('child_process');

// This script builds, packs, and installs sdkv2 from a local directory

const packageJsonPath = path.join(__dirname, '../package.json');
const sdkPackageJsonPath = path.join(SDK_PATH, './package.json');

// Get SDKv2 version
const { version, workspaces } = JSON.parse(
  fs.readFileSync(sdkPackageJsonPath, 'utf8'),
);

let sdkPackages = {};
let sdkPackagesWithDiff = [];

for (const workspace of workspaces) {
  if (workspace.includes('examples')) continue;
  const workspacePackageJson = path.join(SDK_PATH, workspace, 'package.json');
  const { name } = JSON.parse(fs.readFileSync(workspacePackageJson));
  sdkPackages[name] = path.join(SDK_PATH, workspace);

  console.log(`linking ${name}`);
  execSync('npm link', { cwd: sdkPackages[name] });
}

console.log(Object.keys(sdkPackages).join(' '));
throw 1;

execSync(`npm link ${Object.keys(sdkPackages).join(' ')}`, {
  cwd: path.join(__dirname, '../../'),
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

  execSync(`npm link ${keys.join(' ')}`, { cwd: dir });
}
