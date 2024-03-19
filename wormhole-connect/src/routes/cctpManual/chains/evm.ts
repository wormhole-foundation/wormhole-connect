import {
  ChainId,
  ChainName,
  EthContext,
  MessageTransmitter__factory,
  TokenId,
  TokenMessenger__factory,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, ethers, providers, utils } from 'ethers';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getTokenById, getTokenDecimals } from 'utils';
import {
  PayloadType,
  isEvmChain,
  solanaContext,
  toChainId,
  toChainName,
} from 'utils/sdk';
import {
  ManualCCTPMessage,
  SignedMessage,
  isSignedCCTPMessage,
} from '../../types';
import {
  CCTP_LOG_MessageSent,
  CCTP_LOG_TokenMessenger_DepositForBurn,
  getChainNameCCTP,
  getNonce,
} from '../utils';
import ManualCCTP from './abstract';
import config from 'config';

export default class ManualCCTPEvmImpl
  implements ManualCCTP<providers.TransactionReceipt>
{
  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
  ): Promise<providers.TransactionReceipt> {
    const fromChainId = toChainId(sendingChain);
    const fromChainName = toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);

    // only works on EVM
    if (!isEvmChain(sendingChain)) {
      throw new Error('No support for non EVM cctp currently');
    }
    const chainContext = config.wh.getContext(
      sendingChain,
    ) as EthContext<WormholeContext>;
    const tokenMessenger =
      config.wh.mustGetContracts(sendingChain).cctpContracts
        ?.cctpTokenMessenger;
    const circleTokenMessenger = await TokenMessenger__factory.connect(
      tokenMessenger!,
      config.wh.getSigner(fromChainId)!,
    );
    const tokenAddr = (token as TokenId).address;
    // approve
    await chainContext.approve(
      sendingChain,
      circleTokenMessenger.address,
      tokenAddr,
      parsedAmt,
    );
    const recipientChainName = toChainName(recipientChain);
    const destinationDomain = config.chains[recipientChainName]?.cctpDomain;
    if (destinationDomain === undefined)
      throw new Error(`No CCTP on ${recipientChainName}`);
    const tx = await circleTokenMessenger.populateTransaction.depositForBurn(
      parsedAmt,
      destinationDomain,
      chainContext.context.formatAddress(recipientAddress, recipientChain),
      chainContext.context.parseAddress(tokenAddr, sendingChain),
    );

    const sentTx = await config.wh
      .getSigner(fromChainName)
      ?.sendTransaction(tx);
    const rx = await sentTx?.wait();
    if (!rx) throw new Error("Transaction didn't go through");
    return rx;
  }

  async redeem(
    destChain: ChainName | ChainId,
    message: SignedMessage,
    payer: string,
  ): Promise<providers.TransactionReceipt> {
    if (!isSignedCCTPMessage(message))
      throw new Error('Signed message is not for CCTP');
    const context: any = config.wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = config.wh.mustGetSigner(destChain);
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

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ManualCCTPMessage> {
    // use this as reference
    // https://goerli.etherscan.io/tx/0xe4984775c76b8fe7c2b09cd56fb26830f6e5c5c6b540eb97d37d41f47f33faca#eventlog
    const provider = config.wh.mustGetProvider(chain);

    const receipt = await provider.getTransactionReceipt(tx);
    if (!receipt) throw new Error(`No receipt for ${tx} on ${chain}`);

    // Get the CCTP log
    const cctpLog = receipt.logs.filter(
      (log: any) => log.topics[0] === CCTP_LOG_TokenMessenger_DepositForBurn,
    )[0];

    const parsedCCTPLog =
      TokenMessenger__factory.createInterface().parseLog(cctpLog);

    const messageLog = receipt.logs.filter(
      (log: any) => log.topics[0] === CCTP_LOG_MessageSent,
    )[0];

    const message =
      MessageTransmitter__factory.createInterface().parseLog(messageLog).args
        .message;

    const toChain = getChainNameCCTP(parsedCCTPLog.args.destinationDomain);
    const destContext = config.wh.getContext(toChain);
    let recipient = destContext.parseAddress(parsedCCTPLog.args.mintRecipient);
    if (toChain === 'solana') {
      recipient = await solanaContext().getTokenAccountOwner(recipient);
    }
    const fromChain = toChainName(chain);
    const tokenId: TokenId = {
      chain: fromChain,
      address: parsedCCTPLog.args.burnToken,
    };
    const token = getTokenById(tokenId);
    const decimals = await config.wh.fetchTokenDecimals(tokenId, fromChain);
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

  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions?: any,
  ): Promise<BigNumber> {
    const provider = config.wh.mustGetProvider(sendingChain);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice)
      throw new Error('gas price not available, cannot estimate fees');

    // only works on EVM
    if (!isEvmChain(sendingChain)) {
      throw new Error('No support for non EVM cctp currently');
    }
    const chainContext = config.wh.getContext(
      sendingChain,
    ) as EthContext<WormholeContext>;
    const tokenMessenger =
      config.wh.mustGetContracts(sendingChain).cctpContracts
        ?.cctpTokenMessenger;
    const circleSender = TokenMessenger__factory.connect(
      tokenMessenger!,
      config.wh.getSigner(sendingChain)!,
    );
    const tokenAddr = (token as TokenId).address;
    const toChain = toChainName(recipientChain)!;
    const decimals = getTokenDecimals(toChainId(sendingChain), token);
    const parsedAmt = utils.parseUnits(`${amount}`, decimals);
    const destinationDomain = config.chains[toChain]?.cctpDomain;
    if (destinationDomain === undefined)
      throw new Error(`CCTP not supported on ${toChain}`);
    const tx = await circleSender.populateTransaction.depositForBurn(
      parsedAmt,
      destinationDomain,
      chainContext.context.formatAddress(recipientAddress, recipientChain),
      chainContext.context.parseAddress(tokenAddr, sendingChain),
    );
    const est = await provider.estimateGas(tx);
    return est.mul(gasPrice);

    // maybe put this in a try catch and add fallback!
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedCCTPMessage(messageInfo))
      throw new Error('Signed message is not for CCTP');
    const nonce = getNonce(messageInfo.message);
    const context: any = config.wh.getContext(destChain);
    const circleMessageTransmitter =
      context.contracts.mustGetContracts(destChain).cctpContracts
        ?.cctpMessageTransmitter;
    const connection = config.wh.mustGetProvider(destChain);
    const iface = new utils.Interface([
      'function usedNonces(bytes32 domainNonceHash) view returns (uint256)',
    ]);
    const contract = new ethers.Contract(
      circleMessageTransmitter,
      iface,
      connection,
    );

    const cctpDomain = config.chains[messageInfo.fromChain]?.cctpDomain;
    if (cctpDomain === undefined)
      throw new Error(`CCTP not supported on ${messageInfo.fromChain}`);

    const hash = ethers.utils.keccak256(
      ethers.utils.solidityPack(['uint32', 'uint64'], [cctpDomain, nonce]),
    );
    const result = await contract.usedNonces(hash);
    return result.toString() === '1';
  }
}
