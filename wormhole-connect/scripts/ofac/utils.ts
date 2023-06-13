export const getSanctionedAddresses = async (): Promise<string[]> => {
  const data = await readFileFromUrl(OFAC_SDN_LIST_URL);
  const ethAddresses = data
    .match(/Digital Currency Address - [a-zA-Z0-9]+ (0x)?([a-fA-F0-9]{40})/g)
    ?.map((m) => ensure0x(m.split(' ').at(-1) ?? ''));
  return [...new Set(ethAddresses)];
};

const OFAC_SDN_LIST_URL = 'https://www.treasury.gov/ofac/downloads/sdn.csv';

const ensure0x = (str: string) => (str.startsWith('0x') ? str : `0x${str}`);

const readFileFromUrl = (url: string) =>
  fetch(url).then((response) => response.text());
