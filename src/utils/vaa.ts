import { parseTokenTransferVaa } from '@certusone/wormhole-sdk';
import { ChainId } from 'sdk';

import { utils } from 'ethers';

export type ParsedVaa = {
  amount: string;
  emitterAddress: string;
  emitterChain: ChainId;
  fee: string | null;
  fromAddress: string | undefined;
  guardianSignatures: number;
  sequence: string;
  timestamp: number;
  toAddress: string;
  toChain: ChainId;
  tokenAddress: string;
  tokenChain: ChainId;
};

// NOTE: Must wait for CORS fix before we're able to fetch from the UI

// const { REACT_APP_WORMHOLE_API } = process.env;

// export const fetchVaa = (chain: ChainId, emitter: string, seq: string) => {
export const fetchVaa = () => {
  // const chain = 2;
  // const emitter = '0000000000000000000000003ee18b2214aff97000d974cf647e7c347e8fa585';
  // const seq = 101369;
  // const constructedUrl = `${REACT_APP_WORMHOLE_API}v1/signed_vaa/${chain}/${emitter}/${seq}`
  // const url = 'http://api.staging.wormscan.io/v1/signed_vaa/2/0000000000000000000000003ee18b2214aff97000d974cf647e7c347e8fa585/101369'
  // axios.get(url)
  //   .then(function (response: any) {
  //     console.log(response.data)
  //     const vaa = utils.base64.decode(response.data.vaaBytes)
  //     const parsed = parseTokenTransferVaa(vaa)
  //     return parsed;
  //   })
  //   .catch(function (error) {
  //     throw error;
  //   })
  const vaa = utils.base64.decode(
    'AQAAAAMNABvb8ZgIXY0aJjs/WQEsPvFCCGdZl9RP53f0dvvMMOZBbZtZeJaLBQCpsUB1bwxcm+uFH3pduKfLwd9G6zcrU/gAAqOC2mKgdCETjcECncOJ/fWALN6gHDCzh0vmPB45BhfpXtNPxLXoPDAUZD/jEOtaqqCMAk9uhPN2DhOQYUzFhHcAA18gVOd02YddN+Jet5NTtZngku9HCrMAMHtR5eUO3bRCYbV/hdrXsYmwAyt8t2K7bZ4H9y3nantzed1P/OwazVEBBM6VysibeRDBAVg8CBK72UQNIlEUZCxOOsRyKRoMUKYjRaK2gyLqKCfmaqmqD1tz1lRn/ZxTk9bLNyONH3ONuPkBBkaOt5Vl4DKgPvk/CIbPYcL4MOr99Mi/zY+KDC88HS5Re2HIS7RjOqMH9jJRCg2sjMydUqhONgv01zt8HzXqWf4BBwnqcOwpVoDA0woFA17FCYTQZSc0vGYdxahGRnppxYPDSOz1Ji7UJ+ExuVMEUtJ5nvJDbtSOqtZk/+9b2nfXH+sBCRcJDcLIDFc5+R94C0WZ8KB1IcZM0iOAmNoEtEuO1zXjW9Ke82ZgpH+iko0a+8gAnUD+re54q/lAERR90NwGj2oBCg1w4WniAV0PMkWSQyUuoRoY1KBTXQVTAMZyrindLU0kOgecxKgJoznGj8e0LDy+W74Qc4a/X4UrgE8UgNW0XgEBDAnbPN8fmgp5iRap8HZ7MtsSqWPh3WTS1FzD4g2+AH6uR+2X5kDeo4RNZ4oEav+WtDQW7ef0uDa9Hj1JrwRE+5kADb7NJDFUo/lfAO3QuM49yVrnyrwNEtnHmrwmRrRZ+yk9Ej8bxxyN/7hutdRm5Ih0sy6xu0atCvSKIxq+WzfwRQEADwLtmMs6rnHxhdrXE5PV+1xyz0VPi0l2Q0re/77hdES/SEFFNSDdEKTzCSiYT7K8utwe5QllVxixNAzsjK0vb+wBEPoaAWlkjcp9CG+k6MrUOr4+TlV8dVXLhpKhxentAWG4YdmDZgEKgflz3ZEkDupOqFvgnwK102ElnblbqvR5jlkAEqIySj2MN9GzDxrrpaWrIMRAATMl3pYSKS7KV0waXdflGQaHcM0dAtLPxSVCmoQh9N6+Olsi1A+fJ6HGsFt3DLsAY9Hbt+xsAAAAAgAAAAAAAAAAAAAAAD7hiyIUr/lwANl0z2R+fDR+j6WFAAAAAAABi/gBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHdTozAAAAAAAAAAAAAAAAwCqqObIj/o0KDlxPJ+rZCDx1bMIAAi+KZd7UNOHkPEL1Th3kQ7aSq4TLL3n9XEqpTvM9bZfZAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHg8w==',
  );
  const parsed = parseTokenTransferVaa(vaa);
  console.log(parsed);
  const vaaData: ParsedVaa = {
    amount: parsed.amount.toString(),
    emitterAddress: utils.hexlify(parsed.emitterAddress),
    emitterChain: parsed.emitterChain as ChainId,
    fee: parsed.fee ? parsed.fee.toString() : null,
    // fromAddress: parsed.fromAddress ? utils.hexlify(parsed.fromAddress) : undefined,
    fromAddress: utils.hexlify(parsed.to), // TODO: figure out why fromAddress is sometimes undefined
    guardianSignatures: parsed.guardianSignatures.length,
    sequence: parsed.sequence.toString(),
    timestamp: parsed.timestamp,
    toAddress: utils.hexlify(parsed.to),
    toChain: parsed.toChain as ChainId,
    tokenAddress: utils.hexlify(parsed.tokenAddress),
    tokenChain: parsed.tokenChain as ChainId,
  };
  return vaaData;
};
