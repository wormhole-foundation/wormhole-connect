import { describe, it, expect } from 'vitest';
import { parseSanctionedAddresses } from './utils';

// Shape of OFAC's SDN.XML (2026-11-20): Behzad MESRI's entry lists 12 ETH
// addresses, and sdn.csv cuts its Remarks column off after the fourth.
const id = (uid: number, type: string, value: string) => `
      <id>
        <uid>${uid}</uid>
        <idType>${type}</idType>
        <idNumber>${value}</idNumber>
      </id>`;

const SDN_XML = `<?xml version="1.0" standalone="yes"?>
<sdnList xmlns="https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML">
  <sdnEntry>
    <lastName>MESRI</lastName>
    <idList>${id(196506, 'Email Address', 'skote.vahshat@gmail.com')}${id(
  196520,
  'Digital Currency Address - ETH',
  '0x6Fac4D18c912343BF86fa7049364Dd4E424Ab9C0',
)}${id(
  196531,
  'Digital Currency Address - ETH',
  '0x9dd7fa4b4950154f7e75bdd8a77266b99b94ec08',
)}
    </idList>
  </sdnEntry>
  <sdnEntry>
    <idList>${id(
      1,
      'Digital Currency Address - XBT',
      '12aNKp2iDKuhEde2YfPdd4DFGenRUTKupL',
    )}${id(
  2,
  'Digital Currency Address - ETH',
  '6fac4d18c912343bf86fa7049364dd4e424ab9c0',
)}
    </idList>
  </sdnEntry>
</sdnList>`;

describe('parseSanctionedAddresses', () => {
  it('reads every digital currency address id, and nothing else', () => {
    expect(parseSanctionedAddresses(SDN_XML)).toEqual([
      '0x6Fac4D18c912343BF86fa7049364Dd4E424Ab9C0',
      '0x9DD7fA4B4950154F7e75BdD8A77266B99b94Ec08',
      '12aNKp2iDKuhEde2YfPdd4DFGenRUTKupL',
    ]);
  });

  it('returns nothing for a file without addresses', () => {
    expect(parseSanctionedAddresses('<sdnList></sdnList>')).toEqual([]);
  });
});
