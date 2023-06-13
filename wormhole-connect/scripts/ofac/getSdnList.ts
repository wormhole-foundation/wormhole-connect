import { getSanctionedAddresses } from './utils';

const getSdnList = async () => {
  console.log('Parsing OFAC SDN list...');
  const addresses = await getSanctionedAddresses();
  console.log(JSON.stringify(addresses, null, 2));
  console.log('Done!');
};

getSdnList();
