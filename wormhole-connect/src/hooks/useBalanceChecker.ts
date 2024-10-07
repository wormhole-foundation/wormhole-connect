import { useEffect, useState, useMemo } from 'react';
import { amount, routes } from '@wormhole-foundation/sdk';
import { getWalletConnection, TransferWallet } from 'utils/wallet';
import config from 'config';

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

  const feeSymbol = useMemo(() => {
    if (!quote?.relayFee?.token) return;

    return config.sdkConverter.findTokenConfigV1(
      quote?.relayFee?.token,
      Object.values(config.tokens),
    )?.symbol;
  }, [quote]);

  useEffect(() => {
    let isActive = true;
    setCheckingBalance(true);
    (async () => {
      try {
        if (!quote?.relayFee?.amount) return;

        const wallet = getWalletConnection(TransferWallet.SENDING);
        if (!wallet) return;

        const cost = amount.whole(quote.relayFee.amount);

        const feeTokenAddress = quote.relayFee.token.address?.toString();
        const balance = parseFloat(
          await wallet.getBalance(
            feeTokenAddress !== 'native' ? feeTokenAddress : undefined,
          ),
        );
        if (typeof balance !== 'number') {
          throw new Error(
            `Expected balance to be a number, but got "${balance}"`,
          );
        }

        if (isActive) setState({ balance, cost });
      } catch (e) {
        console.error(e);
        if (isActive) setState(null);
      } finally {
        if (isActive) setCheckingBalance(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [quote]);

  return {
    feeSymbol,
    isCheckingBalance,
    hasSufficientBalance:
      !quote?.relayFee || !state || state?.balance > state?.cost,
    walletBalance: state?.balance,
    networkCost: state?.cost,
  };
};
