import { wh } from 'utils/sdk';
import {
  AptosContext,
  SendResult,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  AptosSnapAdapter,
  AptosWalletAdapter,
  BitkeepWalletAdapter,
  FewchaWalletAdapter,
  MartianWalletAdapter,
  NightlyWalletAdapter as NightlyWalletAdapterAptos,
  PontemWalletAdapter,
  RiseWalletAdapter,
  SpikaWalletAdapter,
  WalletAdapterNetwork,
} from '@manahippo/aptos-wallet-adapter';
import { AptosWallet } from '@xlabs-libs/wallet-aggregator-aptos';

import { Types } from 'aptos';

import { isMainnet } from 'config';

const aptosWallets = {
  aptos: new AptosWallet(new AptosWalletAdapter()),
  martian: new AptosWallet(new MartianWalletAdapter()),
  rise: new AptosWallet(new RiseWalletAdapter()),
  nightly: new AptosWallet(new NightlyWalletAdapterAptos()),
  pontem: new AptosWallet(new PontemWalletAdapter()),
  fewcha: new AptosWallet(new FewchaWalletAdapter()),
  spika: new AptosWallet(new SpikaWalletAdapter()),
  snap: new AptosWallet(
    new AptosSnapAdapter({
      network: isMainnet
        ? WalletAdapterNetwork.Mainnet
        : WalletAdapterNetwork.Testnet,
    }),
  ),
  bitkeep: new AptosWallet(new BitkeepWalletAdapter()),
};

export function fetchOptions() {
  return aptosWallets;
}

export async function signAndSendTransaction(
  transaction: SendResult,
  wallet: Wallet | undefined,
) {
  // The wallets do not handle Uint8Array serialization
  const payload = transaction as Types.EntryFunctionPayload;
  if (payload.arguments) {
    payload.arguments = payload.arguments.map((a: any) =>
      a instanceof Uint8Array ? Array.from(a) : a,
    );
  }

  const tx = await (wallet as AptosWallet).signAndSendTransaction(
    payload as Types.TransactionPayload,
  );
  const aptosClient = (wh.getContext('aptos') as AptosContext<WormholeContext>)
    .aptosClient;
  await aptosClient.waitForTransaction(tx.id);

  return tx;
}
