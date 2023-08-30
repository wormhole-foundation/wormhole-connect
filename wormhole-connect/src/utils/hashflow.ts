import axios from 'axios';
import { ChainId } from '@wormhole-foundation/wormhole-connect-sdk';

const { REACT_APP_HASHFLOW_API, REACT_APP_HASHFLOW_SOURCE } = process.env;
const API = REACT_APP_HASHFLOW_API;
const SOURCE = REACT_APP_HASHFLOW_SOURCE;

export async function fetchMarketMakers(chainId: ChainId): Promise<any> {
  if (!API || !SOURCE) {
    throw new Error('Must provide an API url and source');
  }
  const url = `${API}marketMakers?source=${SOURCE}&networkId=${chainId}`;

  return axios
    .get(url)
    .then(function (response: any) {
      console.log('RESPONSE', response);
    })
    .catch(function (error) {
      console.error(error);
    });
}
