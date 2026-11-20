import { getAddress } from 'ethers';

// Read the addresses from SDN.XML, where each one is its own <id> element.
// sdn.csv cannot be used for this: its Remarks column is cut off for entries that
// list many addresses, so a third of the EVM addresses (and the tail of others)
// never appear in it, and some lines end in a partial address.
const OFAC_SDN_LIST_URL =
  'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML';

export const parseSanctionedAddresses = (xml: string): string[] => {
  const addresses: string[] = [];
  for (const id of xml.matchAll(/<id>([\s\S]*?)<\/id>/g)) {
    const type = /<idType>Digital Currency Address - [^<]+<\/idType>/.test(
      id[1],
    );
    const value = /<idNumber>([^<]+)<\/idNumber>/.exec(id[1]);
    if (!type || !value) continue;
    const addr = ensure0xForEvmAddress(value[1].trim());
    try {
      // Convert to checksum addresses
      addresses.push(getAddress(addr));
    } catch {
      addresses.push(addr);
    }
  }
  return [...new Set(addresses)];
};

export const getSanctionedAddresses = async (): Promise<string[]> => {
  const response = await fetch(OFAC_SDN_LIST_URL);
  if (!response.ok) {
    throw new Error(`${OFAC_SDN_LIST_URL}: HTTP ${response.status}`);
  }
  const addresses = parseSanctionedAddresses(await response.text());
  if (addresses.length === 0) {
    // An empty parse means the file changed shape, not that the list is empty.
    throw new Error(
      `${OFAC_SDN_LIST_URL}: no digital currency addresses found`,
    );
  }
  return addresses;
};

const ensure0xForEvmAddress = (str: string) =>
  !str.startsWith('0x') && /^[a-fA-F0-9]{40}$/.test(str) ? `0x${str}` : str;
