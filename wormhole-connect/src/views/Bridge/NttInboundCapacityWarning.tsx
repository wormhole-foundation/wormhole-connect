import React, { useEffect, useMemo, useState } from 'react';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, TOKENS } from 'config';
import AlertBanner from 'components/AlertBanner';
import { NttManual } from 'routes/ntt';
import { parseUnits } from 'ethers/lib/utils';
import { getTokenDecimals } from 'utils';
import { wh } from 'utils/sdk';
import { BigNumber } from 'ethers';
import { getNativeVersionOfToken } from 'store/transferInput';

type Props = {
  token: string;
  amount: string;
  chain: ChainName;
  fromChain: ChainName;
};

const NttInboundCapacityWarning = ({
  token,
  amount,
  chain,
  fromChain,
}: Props) => {
  const [capacity, setCapacity] = useState<BigNumber | undefined>(undefined);
  const [duration, setDuration] = useState<number>(0);
  const nttManagerAddress = TOKENS[token]?.ntt?.nttManager;

  useEffect(() => {
    if (!chain || !nttManagerAddress || !fromChain) return;
    let active = true;
    const fetchCapacity = async () => {
      try {
        const ntt = new NttManual();
        const duration = await ntt.getRateLimitDuration(
          chain,
          nttManagerAddress,
        );
        // if the rate limit duration 0, then rate limiting is disabled
        if (duration === 0) {
          if (active) {
            setCapacity(undefined);
            setDuration(0);
          }
          return;
        }
        const capacity = await ntt.getCurrentInboundCapacity(
          chain,
          nttManagerAddress,
          fromChain,
        );
        if (active) {
          setCapacity(capacity ? BigNumber.from(capacity) : undefined);
          setDuration(duration);
        }
      } catch (error) {
        console.error('Failed to fetch capacity:', error);
        if (active) {
          setCapacity(undefined);
          setDuration(0);
        }
      }
    };
    fetchCapacity();
    return () => {
      active = false;
    };
  }, [chain, nttManagerAddress, fromChain]);

  const showWarning = useMemo(() => {
    if (!token || !amount || !chain || !capacity || !duration) return;
    const destTokenKey = getNativeVersionOfToken(TOKENS[token].symbol, chain);
    const destToken = TOKENS[destTokenKey];
    if (!destToken) return;
    // capacity is in destination token decimals, so we need to convert the amount to the same decimals
    // TODO: test inbound capacity from solana
    console.log('capacity', capacity.toString());
    const decimals = getTokenDecimals(wh.toChainId(chain), destToken.tokenId);
    const parsedAmount = parseUnits(Number(amount).toFixed(decimals), decimals);
    const fivePercentOfCapacity = capacity.mul(5).div(100);
    return parsedAmount.gt(capacity.add(fivePercentOfCapacity));
  }, [token, amount, chain]);

  if (!showWarning) return null;

  // TODO: change 24 hours?
  const content = (
    <>
      {`Your transfer to ${
        CHAINS[chain]?.displayName || 'UNKNOWN'
      } may be delayed due to rate limits configured by ${
        TOKENS[token]?.symbol || 'UNKNOWN'
      }. If your transfer is delayed, you will need to return after 24 hours to complete the transfer. Please consider this before proceeding.`}
    </>
  );
  return <AlertBanner show content={content} warning />;
};

export default NttInboundCapacityWarning;
