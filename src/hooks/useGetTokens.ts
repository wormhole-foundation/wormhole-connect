import config from 'config';
import { Token } from 'config/tokens';
import { RootState } from 'store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useGetTokens = (): {
  sourceToken: Token | undefined;
  destToken: Token | undefined;
} => {
  const { token: sourceTokenTuple, destToken: destTokenTuple } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const sourceToken = useMemo(
    () => (sourceTokenTuple ? config.tokens.get(sourceTokenTuple) : undefined),
    [sourceTokenTuple],
  );

  const destToken = useMemo(
    () => (destTokenTuple ? config.tokens.get(destTokenTuple) : undefined),
    [destTokenTuple],
  );

  return { sourceToken, destToken };
};

export const useGetRedeemTokens = (): {
  sourceToken: Token | undefined;
  destToken: Token | undefined;
} => {
  const { txData } = useSelector((state: RootState) => state.redeem);

  const sourceToken = useMemo(
    () => (txData?.token ? config.tokens.get(txData?.token) : undefined),
    [txData],
  );

  const destToken = useMemo(
    () =>
      txData?.receivedToken
        ? config.tokens.get(txData?.receivedToken)
        : undefined,
    [txData],
  );

  return { sourceToken, destToken };
};
