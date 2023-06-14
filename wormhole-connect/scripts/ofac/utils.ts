export const getSanctionedAddresses = async (): Promise<string[]> => {
  const data = await readFileFromUrl(OFAC_SDN_LIST_URL);
  const ethAddresses =
    data
      .match(/Digital Currency Address - [a-zA-Z0-9]+ [a-zA-Z0-9]+/g)
      ?.map((m) => ensure0xForEvmAddress(m.split(' ').pop() ?? ''))
      // Sort by length and then alphabetically
      .sort((a, b) => a.length - b.length || a.localeCompare(b)) ?? [];
  return [...new Set(ethAddresses)];
};

const OFAC_SDN_LIST_URL = 'https://www.treasury.gov/ofac/downloads/sdn.csv';

const ensure0xForEvmAddress = (str: string) =>
  !str.startsWith('0x') && /^[a-fA-F0-9]{40}$/.test(str) ? `0x${str}` : str;

const readFileFromUrl = (url: string) =>
  fetch(url).then((response) => response.text());
