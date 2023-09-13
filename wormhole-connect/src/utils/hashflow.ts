import axios from 'axios';
import { ChainId, TokenId } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, ethers } from 'ethers';

const { REACT_APP_HASHFLOW_API, REACT_APP_HASHFLOW_SOURCE } = process.env;
const API = REACT_APP_HASHFLOW_API;
const SOURCE = REACT_APP_HASHFLOW_SOURCE;

export async function fetchRFQ(
  sendingToken: TokenId,
  receivingToken: TokenId,
  sendingChain: ChainId,
  receivingChain: any,
  amount: BigNumber | undefined,
  receiveAmount: number | undefined,
  walletAddress: string,
): Promise<any> {
  console.log(
    sendingToken,
    receivingToken,
    sendingChain,
    receivingChain,
    amount,
    receiveAmount,
    walletAddress,
  );
  if (!API || !SOURCE) {
    throw new Error('Must provide an API url and source');
  }
  const url = `${API}rfq`;

  const data = {
    networkId: sendingChain,
    dstNetworkId: receivingChain,
    source: SOURCE,

    rfqType: 0, // RFQ type (e.g. who has the last look). 0: RFQ-t(aker) and 1: RFQ-m(aker)

    // Base token (the token the trader sells).
    baseToken: ethers.constants.AddressZero, // contract address (e.g. "0x123a...789")
    baseTokenAmount: amount?.toString(), // decimal amount (e.g. "1000000" for 1 USDT)

    // Quote token (the token the trader buys).
    quoteToken: ethers.constants.AddressZero, // contract address (e.g. "0x123a...789")
    // quoteTokenAmount: ?string,  // decimal amount (e.g. "1000000" for 1 USDT)

    /* NOTE: Exactly one of base/quote tokenAmount must be present. */

    // The trader wallet address that will swap with our contract. This can be a proxy
    trader: walletAddress,
  };

  const options = {
    method: 'POST',
    url,
    headers: {
      'content-type': 'application/json',
    },
    data,
  };

  return axios
    .request(options)
    .then(function (response: any) {
      console.log('RESPONSE', response);
      if (response.data.status === 'fail') {
        throw new Error(response.data.error.message);
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
