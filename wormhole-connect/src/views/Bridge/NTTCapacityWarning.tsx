import React, { useEffect, useMemo, useState } from 'react';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS, TOKENS } from 'config';
import AlertBanner from 'components/AlertBanner';
import { NTTManual, RATE_LIMIT_DURATION } from 'routes/ntt';
import { parseUnits } from 'ethers/lib/utils';
import { formatSecondsToHoursAndMinutes, getTokenDecimals } from 'utils';
import { wh } from 'utils/sdk';
import { BigNumber } from 'ethers';

type Props = {
  token: string;
  amount: string;
  chain: ChainName;
  fromChain: ChainName;
};

const NTTCapacityWarning = ({ token, amount, chain, fromChain }: Props) => {
  const [capacity, setCapacity] = useState<BigNumber | undefined>(undefined);
  const [rateLimitDuration, setRateLimitDuration] = useState('');
  const managerAddress = TOKENS[token]?.nttManagerAddress;

  useEffect(() => {
    if (!chain || !token || !managerAddress || !fromChain) return;
    let active = true;
    const fetchCapacity = async () => {
      try {
        const ntt = new NTTManual();
        const capacity =
          chain === fromChain
            ? await ntt.getCurrentOutboundCapacity(chain, managerAddress)
            : await ntt.getCurrentInboundCapacity(
                chain,
                managerAddress,
                fromChain,
              );
        if (active) {
          setCapacity(capacity ? BigNumber.from(capacity) : undefined);
        }
      } catch (error) {
        console.error('Failed to fetch capacity:', error);
        if (active) {
          setCapacity(undefined);
        }
      }
    };
    fetchCapacity();
    return () => {
      active = false;
    };
  }, [chain, token, managerAddress, fromChain]);

  useEffect(() => {
    if (!chain || !managerAddress) return;
    let active = true;
    const fetchRateLimitDuration = async () => {
      try {
        if (active) {
          const formatted = formatSecondsToHoursAndMinutes(RATE_LIMIT_DURATION);
          setRateLimitDuration(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch rate limit duration:', error);
        if (active) {
          setRateLimitDuration('');
        }
      }
    };
    fetchRateLimitDuration();
    return () => {
      active = false;
    };
  }, [chain, managerAddress]);

  const showWarning = useMemo(() => {
    if (!token || !amount || !chain || !capacity) return;
    const tokenId = TOKENS[token].tokenId;
    const decimals = getTokenDecimals(wh.toChainId(chain), tokenId);
    const parsedAmount = parseUnits(amount, decimals);
    const fivePercentOfCapacity = capacity.mul(5).div(100);
    return parsedAmount.gt(capacity.add(fivePercentOfCapacity));
  }, [token, amount, chain]);

  if (!showWarning) return null;

  const chainConfig = CHAINS[chain];
  const content = (
    <>
      {`Due to high volume on ${
        chainConfig?.displayName
      }, your transfer may be delayed for ${
        rateLimitDuration ? ' ' + rateLimitDuration : ''
      }. Once the delay ends, you'll need to submit a new transaction${
        chain !== fromChain ? ` on ${chainConfig?.displayName}` : ''
      } to resume the transfer. Please consider this before proceeding.`}
    </>
  );
  return <AlertBanner show content={content} warning />;
};

export default NTTCapacityWarning;
