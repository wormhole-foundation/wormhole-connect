import { useConfig } from 'contexts/ConfigContext';
import type { Token } from 'config/tokens';
import type { RootState } from 'store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useGetTokens = (): {
  sourceToken: Token | undefined;
  destToken: Token | undefined;
} => {
  const config = useConfig();
  const { token: sourceTokenTuple, destToken: destTokenTuple } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const sourceToken = useMemo(
    () => (sourceTokenTuple ? config.tokens.get(sourceTokenTuple) : undefined),
    [config, sourceTokenTuple],
  );

  const destToken = useMemo(
    () => (destTokenTuple ? config.tokens.get(destTokenTuple) : undefined),
    [config, destTokenTuple],
  );

  return { sourceToken, destToken };
};

export const useGetRedeemTokens = (): {
  sourceToken: Token | undefined;
  destToken: Token | undefined;
} => {
  const config = useConfig();
  const { txData } = useSelector((state: RootState) => state.redeem);

  const sourceToken = useMemo(
    () => (txData?.token ? config.tokens.get(txData?.token) : undefined),
    [config, txData],
  );

  const destToken = useMemo(
    () =>
      txData?.receivedToken
        ? config.tokens.get(txData?.receivedToken)
        : undefined,
    [config, txData],
  );

  return { sourceToken, destToken };
};
