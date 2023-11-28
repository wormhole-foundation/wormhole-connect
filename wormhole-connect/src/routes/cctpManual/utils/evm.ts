import {
  ChainId,
  ChainName,
  EthContext,
  MessageTransmitter__factory,
  TokenId,
  TokenMessenger__factory,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { providers, utils } from 'ethers';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import { PayloadType, isEvmChain, solanaContext, wh } from 'utils/sdk';
import {
  ManualCCTPMessage,
  SignedMessage,
  isSignedCCTPMessage,
} from '../../types';
import {
  CCTP_LOG_MessageSent,
  CCTP_LOG_TokenMessenger_DepositForBurn,
  getChainNameCCTP,
} from '../utils';

export async function sendFromEvm(
  token: TokenId | 'native',
  amount: string,
  sendingChain: ChainName | ChainId,
  senderAddress: string,
  recipientChain: ChainName | ChainId,
  recipientAddress: string,
): Promise<providers.TransactionReceipt> {
  const fromChainId = wh.toChainId(sendingChain);
  const fromChainName = wh.toChainName(sendingChain);
  const decimals = getTokenDecimals(fromChainId, token);
  const parsedAmt = utils.parseUnits(amount, decimals);

  // only works on EVM
  if (!isEvmChain(sendingChain)) {
    throw new Error('No support for non EVM cctp currently');
  }
  const chainContext = wh.getContext(
    sendingChain,
  ) as EthContext<WormholeContext>;
  const tokenMessenger =
    wh.mustGetContracts(sendingChain).cctpContracts?.cctpTokenMessenger;
  const circleTokenMessenger = await TokenMessenger__factory.connect(
    tokenMessenger!,
    wh.getSigner(fromChainId)!,
  );
  const tokenAddr = (token as TokenId).address;
  // approve
  await chainContext.approve(
    sendingChain,
    circleTokenMessenger.address,
    tokenAddr,
    parsedAmt,
  );
  const recipientChainName = wh.toChainName(recipientChain);
  const destinationDomain = wh.conf.chains[recipientChainName]?.cctpDomain;
  if (destinationDomain === undefined)
    throw new Error(`No CCTP on ${recipientChainName}`);
  const tx = await circleTokenMessenger.populateTransaction.depositForBurn(
    parsedAmt,
    destinationDomain,
    chainContext.context.formatAddress(recipientAddress, recipientChain),
    chainContext.context.parseAddress(tokenAddr, sendingChain),
  );

  const sentTx = await wh.getSigner(fromChainName)?.sendTransaction(tx);
  const rx = await sentTx?.wait();
  if (!rx) throw new Error("Transaction didn't go through");
  return rx;
}

export async function getMessageFromEvm(
  tx: string,
  chain: ChainName | ChainId,
): Promise<ManualCCTPMessage> {
  // only EVM
  // use this as reference
  // https://goerli.etherscan.io/tx/0xe4984775c76b8fe7c2b09cd56fb26830f6e5c5c6b540eb97d37d41f47f33faca#eventlog
  const provider = wh.mustGetProvider(chain);

  const receipt = await provider.getTransactionReceipt(tx);
  if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

  // Get the CCTP log
  const cctpLog = receipt.logs.filter(
    (log) => log.topics[0] === CCTP_LOG_TokenMessenger_DepositForBurn,
  )[0];

  const parsedCCTPLog =
    TokenMessenger__factory.createInterface().parseLog(cctpLog);

  const messageLog = receipt.logs.filter(
    (log) => log.topics[0] === CCTP_LOG_MessageSent,
  )[0];

  const message =
    MessageTransmitter__factory.createInterface().parseLog(messageLog).args
      .message;

  const toChain = getChainNameCCTP(parsedCCTPLog.args.destinationDomain);
  const destContext = wh.getContext(toChain);
  let recipient = destContext.parseAddress(parsedCCTPLog.args.mintRecipient);
  if (toChain === 'solana') {
    recipient = await solanaContext().getTokenAccountOwner(recipient);
  }
  const fromChain = wh.toChainName(chain);
  const tokenId: TokenId = {
    chain: fromChain,
    address: parsedCCTPLog.args.burnToken,
  };
  const token = getTokenById(tokenId);
  const decimals = await wh.fetchTokenDecimals(tokenId, fromChain);
  return {
    sendTx: receipt.transactionHash,
    sender: receipt.from,
    amount: parsedCCTPLog.args.amount.toString(),
    payloadID: PayloadType.Manual,
    recipient: recipient,
    toChain,
    fromChain: fromChain,
    tokenAddress: parsedCCTPLog.args.burnToken,
    tokenChain: fromChain,
    tokenId: tokenId,
    tokenDecimals: decimals,
    tokenKey: token?.key || '',
    receivedTokenKey: getNativeVersionOfToken('USDC', toChain),
    gasFee: receipt.gasUsed.mul(receipt.effectiveGasPrice).toString(),
    block: receipt.blockNumber,
    message,

    // manual CCTP does not use wormhole
    emitterAddress: '',
    sequence: '',
  };
}

export async function redeemOnEvm(
  destChain: ChainName | ChainId,
  message: SignedMessage,
): Promise<providers.TransactionReceipt> {
  if (!isSignedCCTPMessage(message))
    throw new Error('Signed message is not for CCTP');
  const context: any = wh.getContext(destChain);
  const circleMessageTransmitter =
    context.contracts.mustGetContracts(destChain).cctpContracts
      ?.cctpMessageTransmitter;
  const connection = wh.mustGetSigner(destChain);
  const contract = MessageTransmitter__factory.connect(
    circleMessageTransmitter,
    connection,
  );
  if (!message.attestation) {
    throw new Error('No signed attestation');
  }
  const tx = await contract.receiveMessage(
    message.message,
    message.attestation,
  );
  return tx.wait();
}
