import { SANCTIONED_WALLETS } from '../../src/consts/wallet';
import { getSanctionedAddresses } from './utils';

const checkSdnListForUpdates = async () => {
  console.log('Checking OFAC SDN list for updates...');
  const addresses = await getSanctionedAddresses();
  const newAddresses = addresses.filter(
    (address) => !SANCTIONED_WALLETS.has(address),
  );

  if (newAddresses.length) {
    console.log('Updated list:', JSON.stringify(addresses, null, 2));
    throw new Error(
      'New addresses found, please update `SANCTIONED_WALLETS` in `src/consts/wallet.ts`.',
    );
  }

  console.log('No new addresses found. Done!');
};

checkSdnListForUpdates();
