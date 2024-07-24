import { SendResult } from '@wormhole-foundation/wormhole-connect-sdk';
import { WalletAdapterNetwork as SolanaNetwork } from '@solana/wallet-adapter-base';

import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  BitgetWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SolongWalletAdapter,
  TorusWalletAdapter,
  NightlyWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import {
  AddressLookupTableProgram,
  clusterApiUrl,
  ConfirmOptions,
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@xlabs-libs/wallet-aggregator-solana';

import config from 'config';
import { solanaContext } from 'utils/sdk';

const getWalletName = (wallet: Wallet) =>
  wallet.getName().toLowerCase().replaceAll('wallet', '').trim();

export function fetchOptions() {
  const tag = config.isMainnet ? 'mainnet-beta' : 'devnet';
  const connection = new Connection(config.rpcs.solana || clusterApiUrl(tag));

  return {
    ...getSolanaStandardWallets(connection).reduce((acc, w) => {
      acc[getWalletName(w)] = w;
      return acc;
    }, {} as Record<string, Wallet>),
    bitget: new SolanaWallet(new BitgetWalletAdapter(), connection),
    clover: new SolanaWallet(new CloverWalletAdapter(), connection),
    coin98: new SolanaWallet(new Coin98WalletAdapter(), connection),
    solong: new SolanaWallet(new SolongWalletAdapter(), connection),
    torus: new SolanaWallet(new TorusWalletAdapter(), connection),
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    ...(config.walletConnectProjectId
      ? {
          walletConnect: new SolanaWallet(
            new WalletConnectWalletAdapter({
              network: config.isMainnet
                ? SolanaNetwork.Mainnet
                : SolanaNetwork.Devnet,
              options: {
                projectId: config.walletConnectProjectId,
              },
            }),
            connection,
          ),
        }
      : {}),
  };
}

export async function signAndSendTransaction(
  transaction: SendResult,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
) {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }
  const solanaWallet = wallet as SolanaWallet;
  if (wallet.getName() === 'SquadsX' || wallet.getName() === 'Phantom') {
    const tx = transaction as Transaction;
    const { connection } = solanaContext();
    const payer = solanaWallet.getAdapter().publicKey!;
    const alt = new PublicKey('DUJnxSGLn7Mgh1ahP14umL52L7Z5dVpeMBsgr2bvdbHj');
    const unique = tx.instructions
      .flatMap((ix) => ix.keys)
      .reduce(
        (acc, { pubkey }) => ({
          ...acc,
          [pubkey.toString()]: pubkey,
        }),
        {},
      );
    console.log(Object.values<PublicKey>(unique).map((key) => key.toBase58()));

    if (connection) {
      if (wallet.getName() === 'Phantom') {
        const extendInstruction = AddressLookupTableProgram.extendLookupTable({
          payer,
          authority: payer,
          lookupTable: alt,
          addresses: Object.values(unique),
        });
        const id = await solanaWallet
          .getAdapter()
          .sendTransaction(
            new Transaction().add(extendInstruction),
            connection,
          );
        return { id };
      }
      const { value: lookupTableAccount } =
        await connection.getAddressLookupTable(alt);
      console.log(lookupTableAccount);

      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(wallet.getAddress()!),
        instructions: tx.instructions,
        recentBlockhash: tx.recentBlockhash!,
      }).compileToV0Message([lookupTableAccount!]);
      const versioned = new VersionedTransaction(messageV0);
      //      console.log(versioned);
      //      const serialized = versioned.serialize();
      //      const size = serialized.length + 1 + (versioned.signatures.length * 64);
      //      console.log('tx size', size);
      const txSignature = await solanaWallet
        ?.getAdapter()
        .sendTransaction(versioned, connection, options);
      // Confirm the transaction was successful.
      const confirmationResult = await connection.confirmTransaction(
        txSignature,
        'confirmed',
      );

      if (confirmationResult.value.err) {
        throw new Error(JSON.stringify(confirmationResult.value.err));
      } else {
        console.log('Transaction successfully submitted!');
      }
      return { id: txSignature, data: txSignature, ...confirmationResult };
    }
    throw new Error('Connection is undefined');
  } else {
    return await solanaWallet.signAndSendTransaction({
      transaction: transaction as Transaction,
      options,
    });
  }
}
