import {
  ChainId,
  ChainName,
  NATIVE,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';

export const getSolanaAssociatedTokenAccount = async (
  token: TokenId | typeof NATIVE,
  sendingChain: ChainName | ChainId,
  recipientAddress: string,
): Promise<string> => {
  return 'TODO SDKV2';
  /*
  let tokenId = token;
  if (token === NATIVE) {
    const context = config.wh.getContext(sendingChain);
    tokenId = await context.getWrappedNativeTokenId(sendingChain);
  }
  const context = solanaContext();
  const account = await context.getAssociatedTokenAddress(
    tokenId as TokenId,
    recipientAddress,
  );
  return account.toString();
  */
};
