import {
  ChainName,
  ChainId,
  //isGatewayChain as isGatewayChainSdk,
} from 'sdklegacy';
//import config from 'config';

export function isGatewayChain(chainId: ChainId | ChainName): boolean {
  return false;

  /* TODO SDKV2
  const id = config.wh.toChainId(chainId);
  return isGatewayChainSdk(id);
  */
}
