import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AccountState,
  Network,
  setupWalletSelector,
  Wallet,
  WalletSelector,
  WalletSelectorState,
} from "@near-wallet-selector/core";
import { setupDefaultWallets } from "@near-wallet-selector/default-wallets";
import { setupMathWallet } from "@near-wallet-selector/math-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import {
  setupModal,
  WalletSelectorModal,
} from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupSender } from "@near-wallet-selector/sender";
import { KeyPair, WalletConnection } from "near-api-js";
import { distinctUntilChanged, map, Subscription } from "rxjs";
import { Props } from './WalletContext'
const { REACT_APP_ENV } = process.env;
export const NEAR_TOKEN_BRIDGE_ACCOUNT =
  REACT_APP_ENV === "MAINNET"
    ? "contract.portalbridge.near"
    : "token.wormhole.testnet";

// monkeypatch to allow for full permissions
// https://github.com/near/near-api-js/blob/96785cb3db14be593b6e6d013b6870ba56a212a8/packages/near-api-js/src/wallet-account.ts#L177
const LOGIN_WALLET_URL_SUFFIX = "/login/";
const PENDING_ACCESS_KEY_PREFIX = "pending_key"; // browser storage key for a pending access key (i.e. key has been generated but we are not sure it was added yet)
WalletConnection.prototype.requestSignIn = async function requestSignIn({
  contractId,
  methodNames,
  successUrl,
  failureUrl,
}: any) {
  const currentUrl = new URL(window.location.href);
  const newUrl = new URL(this._walletBaseUrl + LOGIN_WALLET_URL_SUFFIX);
  newUrl.searchParams.set("success_url", successUrl || currentUrl.href);
  newUrl.searchParams.set("failure_url", failureUrl || currentUrl.href);
  if (contractId) {
    /* Throws exception if contract account does not exist */
    const contractAccount = await this._near.account(contractId);
    await contractAccount.state();

    // THIS IS THE EDIT
    // newUrl.searchParams.set("contract_id", contractId);
    const accessKey = KeyPair.fromRandom("ed25519");
    newUrl.searchParams.set("public_key", accessKey.getPublicKey().toString());
    await this._keyStore.setKey(
      this._networkId,
      PENDING_ACCESS_KEY_PREFIX + accessKey.getPublicKey(),
      accessKey
    );
  }

  if (methodNames) {
    methodNames.forEach((methodName: any) => {
      newUrl.searchParams.append("methodNames", methodName);
    });
  }

  window.location.assign(newUrl.toString());
};

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

interface INearContext {
  connect(): void;
  disconnect(): void;
  accounts: AccountState[];
  accountId: string | null;
  wallet: Wallet | null;
}

const NearContext = React.createContext<INearContext>({
  connect: () => {},
  disconnect: () => {},
  accounts: [],
  accountId: null,
  wallet: null,
});

const NearDevnet: Network = {
  networkId: "sandbox",
  nodeUrl: "http://localhost:3030",
  helperUrl: "",
  explorerUrl: "",
  indexerUrl: "",
};

export const NearContextProvider = ({
  children,
}: Props) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    let cancelled = false;
    let subscription: Subscription;
    (async () => {
      const selector = await setupWalletSelector({
        network:
          REACT_APP_ENV === "MAINNET"
            ? "mainnet"
            : "testnet",
        modules: [
          ...(await setupDefaultWallets()),
          setupNearWallet(),
          setupMyNearWallet(),
          setupSender(),
          setupMathWallet(),
          setupNightly(),
          setupMeteorWallet(),
        ],
        debug: true,
      });
      const modal = setupModal(selector, {
        contractId: NEAR_TOKEN_BRIDGE_ACCOUNT || "",
      });
      const accounts = selector.store.getState().accounts;
      subscription = selector.store.observable
        .pipe(
          map((state: WalletSelectorState) => state.accounts),
          distinctUntilChanged()
        )
        .subscribe((nextAccounts: AccountState[]) => {
          if (!cancelled) {
            setAccounts(nextAccounts);
          }
        });
      if (!cancelled) {
        setSelector(selector);
        setModal(modal);
        setAccounts(accounts);
      }
    })();
    return () => {
      subscription?.unsubscribe();
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const accountId =
      accounts.find((account) => account.active)?.accountId || null;
    setAccountId(accountId);
    (async () => {
      setWallet((await selector?.wallet()) || null);
    })();
  }, [selector, accounts]);

  const connect = useCallback(() => {
    modal?.show();
  }, [modal]);

  const disconnect = useCallback(() => {
    modal?.hide();
    selector
      ?.wallet()
      .then((wallet) =>
        wallet.signOut().catch((error) => console.error(error))
      );
  }, [selector, modal]);

  const value = useMemo(
    () => ({
      connect,
      disconnect,
      accounts,
      accountId,
      wallet,
    }),
    [connect, disconnect, accounts, accountId, wallet]
  );

  return <NearContext.Provider value={value}>{children}</NearContext.Provider>;
};

export function useNearContext() {
  return useContext(NearContext);
}
