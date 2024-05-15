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

let sdkPackages = [];
let sdkPackagesWithDiff = [];

for (const workspace of workspaces) {
  if (workspace.includes('examples')) continue;
  const workspacePackageJson = path.join(SDK_PATH, workspace, 'package.json');
  const { name } = JSON.parse(fs.readFileSync(workspacePackageJson));
  sdkPackages.push(name);

  const diff = execSync(`git diff ${workspace}`, { cwd: path.join(SDK_PATH) });
  if (diff.length > 0) {
    sdkPackagesWithDiff.push(name);
  }
}

if (command === 'install') {
  console.log(
    `Building and installing sdkv2 version ${version}\nPackages:\n  ${sdkPackages.join(
      '\n  ',
    )}`,
  );

  // Build SDKv2
  console.log('Building SDK...');
  execSync('npm run build', { cwd: SDK_PATH, encoding: 'utf-8' });

  // Pack SDKv2
  console.log('Packing SDK...');
  execSync('npm pack --workspaces', { cwd: SDK_PATH, encoding: 'utf-8' });

  // Get freshly made archives
  const packageValues = {};
  for (let pkg of sdkPackages) {
    packageValues[pkg] = path.join(
      SDK_PATH,
      `wormhole-foundation-${pkg.split('/')[1]}-${version}.tgz`,
    );
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

  let alreadyHasLocalInstalled = packageJson.dependencies.hasOwnProperty(
    '@wormhole-foundation/sdk-connect',
  );

  for (let pkg in packageValues) {
    packageJson.dependencies[pkg] = packageValues[pkg];
  }

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, undefined, 2),
    'utf-8',
  );

  let toInstall;

  if (alreadyHasLocalInstalled && sdkPackagesWithDiff.length > 0) {
    // Detected local changes; install only these
    console.log('Installing packages with local diff');
    toInstall = sdkPackagesWithDiff;
  } else {
    // Did not detect local changes; install all packages
    console.log('Installing all packages');
    toInstall = sdkPackages;
  }

  for (let pkg of toInstall) {
    console.log(pkg);
    execSync(`npm install ${pkg}`, { cwd: path.join(__dirname, '..') });
  }
} else if (command === 'remove') {
  // TODO?
}
