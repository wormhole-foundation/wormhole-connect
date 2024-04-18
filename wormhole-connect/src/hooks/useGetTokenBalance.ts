import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { useEffect, useState } from 'react';
import {
  accessBalance,
  formatBalance,
  setBalance as setBalanceStore,
} from 'store/transferInput';
import config from 'config';

const useGetTokenBalance = (
  walletAddress: string,
  chain: ChainName | undefined,
  token: string,
): string | undefined => {
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const balances = useSelector(
    (state: RootState) => state.transferInput.balances,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    setBalance(undefined);
    if (!walletAddress || !chain || !token) {
      return;
    }

    let isActive = true;

    const getBalance = async () => {
      const tokenConfig = config.tokens[token];
      const chainConfig = config.chains[chain];
      if (!tokenConfig || !chainConfig) {
        return;
      }

      const cachedBal = accessBalance(balances, walletAddress, chain, token);
      if (cachedBal !== null) {
        if (isActive) {
          setBalance(cachedBal);
        }
        return;
      }

      const bal =
        chainConfig.gasToken === token
          ? await config.wh.getNativeBalance(walletAddress, chain, token)
          : tokenConfig.tokenId
          ? await config.wh.getTokenBalance(
              walletAddress,
              tokenConfig.tokenId,
              chain,
            )
          : null;
      if (isActive) {
        const formattedBal = formatBalance(chain, tokenConfig, bal)[token];
        setBalance(formattedBal || undefined);
        dispatch(
          setBalanceStore({
            chain,
            token,
            address: walletAddress,
            balance: formattedBal,
          }),
        );
      }
    };

    getBalance();

    return () => {
      isActive = false;
    };
    // Otherwise, fetch the balance
  }, [balances, walletAddress, chain, token]);

  return balance;
};

export default useGetTokenBalance;
