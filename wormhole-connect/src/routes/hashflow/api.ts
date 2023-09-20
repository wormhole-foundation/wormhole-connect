import axios from 'axios';
import { ChainName, TokenId } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { CHAINS } from 'config';

const { REACT_APP_HASHFLOW_API, REACT_APP_HASHFLOW_SOURCE } = process.env;
const API = REACT_APP_HASHFLOW_API;
const SOURCE = REACT_APP_HASHFLOW_SOURCE;

export async function fetchRFQ(
  sendingToken: TokenId,
  receivingToken: TokenId,
  sendingChain: ChainName,
  receivingChain: ChainName,
  amount: BigNumber | undefined,
  walletAddress: string,
): Promise<any> {
  if (!API || !SOURCE) {
    throw new Error('Must provide an API url and source');
  }
  const url = `${API}rfq`;

  const sendingChainId = CHAINS[sendingChain]?.chainId;
  const receivingChainId = CHAINS[receivingChain]?.chainId;

  // if sending to the same chain, don't need to specify dstNetworkId
  const destNetworkId =
    sendingChainId !== receivingChainId
      ? { dsNetworkId: receivingChainId }
      : {};

  const data = {
    networkId: sendingChainId,
    ...destNetworkId,
    source: SOURCE,

    rfqType: 0,

    baseToken: sendingToken.address,
    baseTokenAmount: amount?.toString(),

    quoteToken: receivingToken.address,
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
      console.log('RFQ RESPONSE', response);
      if (response.status !== 200) {
        throw new Error('error fetching Hashflow RFQ');
      }
      if (response.data.status === 'fail') {
        throw new Error(response.data.error.message);
      }
      if (response.data.status === 'success') {
        return response.data;
      }
      throw new Error('error fetching Hashflow RFQ');
    })
    .catch(function (error) {
      console.error(error);
      throw new Error(error);
    });
}

export async function estimateHashflowFees(
  sendingChain: ChainName,
  receivingChain: ChainName,
): Promise<any> {
  if (!API || !SOURCE) {
    throw new Error('Must provide an API url and source');
  }
  const sendingChainId = CHAINS[sendingChain]?.chainId;
  // const receivingChainId = CHAINS[receivingChain]?.chainId;
  // const url = `${API}xchain-fee-estimate?source=${SOURCE}&protocol=0&srcNetworkId=${sendingChainId}${sendingChainId === receivingChainId ? '' : `&dstNetworkId=${receivingChainId}`}`;
  const url = `${API}xchain-fee-estimate?source=${SOURCE}&protocol=0&srcNetworkId=${sendingChainId}&dstNetworkId=5`;

  return axios
    .get(url)
    .then(function (response: any) {
      console.log('FEE ESTIMATE RESPONSE', response);
      if (response.status !== 200) {
        throw new Error('error fetching Hashflow fee estimates');
      }
      if (response.data.status === 'fail') {
        throw new Error(response.data.error.message);
      }
      if (response.data.status === 'success') {
        return response.data;
      }
      throw new Error('error fetching Hashflow fee estimates');
    })
    .catch(function (error) {
      console.error(error);
    });
}

export async function getHashflowTokensByChain(chain: ChainName): Promise<any> {
  if (!API || !SOURCE) {
    throw new Error('Must provide an API url and source');
  }
  const chainId = CHAINS[chain]?.chainId;
  const url = `${API}tokens?networkId=${chainId}&source=${SOURCE}`;

  return axios
    .get(url)
    .then(function (response: any) {
      console.log('TOKENS', response);
      if (response.status !== 200) {
        throw new Error(
          `error fetching Hashflow supported tokens for ${chain}`,
        );
      }
      if (response.data.status === 'fail') {
        throw new Error(response.data.error.message);
      }
      if (response.data.status === 'success') {
        return response.data;
      }
      throw new Error(`error fetching Hashflow supported tokens for ${chain}`);
    })
    .catch(function (error) {
      console.error(error);
    });
}
