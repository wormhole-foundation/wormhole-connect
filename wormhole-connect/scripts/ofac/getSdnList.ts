import { getSanctionedAddresses } from './utils';

const getSdnList = async () => {
  console.log('Parsing OFAC SDN list...');
  const addresses = await getSanctionedAddresses();
  console.log(addresses);
  console.log('Done!');
};

getSdnList();
