import { useEffect, useState, useMemo } from 'react';
import { amount, routes } from '@wormhole-foundation/sdk';
import { getWalletConnection, TransferWallet } from 'utils/wallet';
import config from 'config';
import { useIsMounted } from './useIsMounted';

export const useBalanceChecker = (
  quote?: routes.Quote<
    routes.Options,
    routes.ValidatedTransferParams<routes.Options>
  >,
): {
  feeSymbol?: string;
  isCheckingBalance: boolean;
  hasSufficientBalance: boolean;
  walletBalance?: number;
  networkCost?: number;
} => {
  const [isCheckingBalance, setCheckingBalance] = useState(false);
  const [state, setState] = useState<{ balance: number; cost: number } | null>(
    null,
  );
  const isMounted = useIsMounted();

  const feeSymbol = useMemo(() => {
    if (!quote?.relayFee?.token) return;

    return config.sdkConverter.findTokenConfigV1(
      quote?.relayFee?.token,
      Object.values(config.tokens),
    )?.symbol;
  }, [quote]);

  useEffect(() => {
    setCheckingBalance(true);
    (async () => {
      try {
        if (!quote?.relayFee?.amount) return;

        const wallet = getWalletConnection(TransferWallet.SENDING);
        if (!wallet) return;

        const cost = amount.whole(quote.relayFee.amount);
        const balance = parseFloat(await wallet.getBalance());

        if (isMounted.current) setState({ balance, cost });
      } catch (e) {
        console.error(e);
        if (isMounted.current) setState(null);
      } finally {
        if (isMounted.current) setCheckingBalance(false);
      }
    })();
  }, [quote, isMounted]);

  return {
    feeSymbol,
    isCheckingBalance,
    hasSufficientBalance: !!state && state?.balance > state?.cost,
    walletBalance: state?.balance,
    networkCost: state?.cost,
  };
};
