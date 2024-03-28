import React, { useEffect, useMemo, useState } from 'react';
import AlertBanner from 'components/AlertBanner';
import { NttManual } from 'routes/ntt';
import { parseUnits } from 'ethers/lib/utils';
import { getTokenDecimals } from 'utils';
import { BigNumber } from 'ethers';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import config from 'config';
import { getNttGroupKey, getNttManagerAddress, isNttToken } from 'utils/ntt';

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return seconds === 1 ? `${seconds} second` : `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? `${minutes} minute` : `${minutes} minutes`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return hours === 1 ? `${hours} hour` : `${hours} hours`;
  }
}

const NttInboundCapacityWarning = () => {
  const { fromChain, toChain, token, destToken, receiveAmount } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const amount = receiveAmount.data || '0';
  const [capacity, setCapacity] = useState<BigNumber | undefined>(undefined);
  const [duration, setDuration] = useState<number>(0);
  const groupKey = getNttGroupKey(
    config.tokens[token],
    config.tokens[destToken],
  );
  const nttManagerAddress =
    groupKey && getNttManagerAddress(config.tokens[destToken], groupKey);

  useEffect(() => {
    if (!toChain || !nttManagerAddress || !fromChain) return;
    let active = true;
    const fetchCapacity = async () => {
      try {
        const ntt = new NttManual();
        const duration = await ntt.getRateLimitDuration(
          toChain,
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
          toChain,
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
  }, [toChain, nttManagerAddress, fromChain]);

  const showWarning = useMemo(() => {
    if (
      !destToken ||
      !amount ||
      !toChain ||
      !capacity ||
      !duration ||
      !fromChain ||
      !groupKey
    )
      return false;
    const destTokenConfig = config.tokens[destToken];
    if (!destTokenConfig || !isNttToken(destTokenConfig)) return false;
    // capacity is in destination token decimals, so we need to convert the amount to the same decimals
    const decimals = getTokenDecimals(
      config.wh.toChainId(toChain),
      destTokenConfig.tokenId,
    );
    const parsedAmount = parseUnits(Number(amount).toFixed(decimals), decimals);
    const threshold = capacity.mul(95).div(100); // 95% of capacity
    return parsedAmount.gt(threshold);
  }, [destToken, amount, toChain, groupKey]);

  if (!showWarning || !toChain) return null;

  const content = (
    <>
      {`Your transfer to ${
        config.chains[toChain]?.displayName || 'UNKNOWN'
      } may be delayed due to rate limits set by ${
        config.tokens[destToken]?.symbol || 'UNKNOWN'
      }. If your transfer is delayed, you will need to return after ${formatDuration(
        duration,
      )} to complete the transfer. Please consider this before proceeding.`}
    </>
  );
  return <AlertBanner show content={content} warning />;
};

export default NttInboundCapacityWarning;
