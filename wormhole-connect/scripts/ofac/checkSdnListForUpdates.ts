import { SANCTIONED_WALLETS } from '../../src/consts/wallet';
import { getSanctionedAddresses } from './utils';
import * as prettier from 'prettier';
import fs from 'fs';

const checkSdnListForUpdates = async () => {
  console.log('Checking OFAC SDN list for updates...');
  const addresses = await getSanctionedAddresses();
  const newAddresses = addresses.filter(
    (address) => !SANCTIONED_WALLETS.has(address),
  );

  // Always update file to ensure it's correctly formatted
  const sourceCode = `export const SANCTIONED_WALLETS = Object.freeze(new Set(${JSON.stringify(
    addresses,
    null,
    4,
  )}));`;

  try {
    fs.writeFileSync(
      'src/consts/wallet.ts',
      await prettier.format(sourceCode, { parser: 'babel', singleQuote: true }),
    );
  } catch (e) {
    // Throw an error so this script exits with a non-zero code, so it fails in CI
    throw new Error(`Failed to update src/consts/wallet.ts: ${e}`);
  }

  if (newAddresses.length) {
    throw new Error(
      'New addresses found. Updated `SANCTIONED_WALLETS` in `src/consts/wallet.ts`. Please commit and push changes.',
    );
  }

  console.log('No new addresses found. Done!');
};

checkSdnListForUpdates();
