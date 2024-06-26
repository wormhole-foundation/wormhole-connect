import { LinearProgress, linearProgressClasses } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { ChainName } from 'sdklegacy';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { getCurrentBlock } from 'utils/sdk';
import { RoutesConfig } from 'config/routes';
import { RootState } from 'store';

const BorderLinearProgress = styled(LinearProgress)(({ theme }: any) => ({
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.card.secondary,
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.success[300],
  },
}));

const useStyles = makeStyles()((theme) => ({
  confirmations: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
  },
  confirmationsText: {
    textAlign: 'center',
  },
}));

type Props = {
  chain: ChainName;
  blockHeight: number;
};

function Confirmations(props: Props) {
  const { classes } = useStyles();
  const { chain, blockHeight } = props;
  const chainConfig = config.chains[chain]!;
  const requiredHeight = blockHeight + chainConfig.finalityThreshold;
  const [currentBlock, setCurrentBlock] = useState(0);

  const { route, isInvalidVaa } = useSelector(
    (state: RootState) => state.redeem,
  );

  useEffect(() => {
    if (chainConfig.finalityThreshold === 0) {
      return;
    }
    let cancelled = false;

    // Loop until we have reached the latest block or cancelled
    // This will update the progress bar as the next block is fetched
    (async () => {
      let block = 0;
      while (block < requiredHeight && !cancelled) {
        block = await getCurrentBlock(props.chain);
        if (!cancelled) {
          setCurrentBlock(block);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requiredHeight, props.chain, chainConfig.finalityThreshold]);

  const confirmations = useMemo(() => {
    if (currentBlock === 0) {
      // Current block is zero during initial state
      // We should not calculate confirmations until it's fetched
      return 0;
    }

    // Precaution to prevent a negative block difference
    const blockDiff = Math.max(requiredHeight - currentBlock, 0);

    return chainConfig.finalityThreshold - blockDiff;
  }, [chainConfig.finalityThreshold, currentBlock, requiredHeight]);

  // Percentage of the confirmations completed
  const percentage = useMemo(
    () =>
      chainConfig.finalityThreshold === 0
        ? 100
        : Math.floor((confirmations / chainConfig.finalityThreshold) * 100),
    [chainConfig.finalityThreshold, confirmations],
  );

  return (
    <div className={classes.confirmations}>
      <BorderLinearProgress
        variant="determinate"
        value={percentage}
        color="secondary"
      />
      <div className={classes.confirmationsText}>
        {percentage < 100 ? (
          <>
            {confirmations} / {chainConfig.finalityThreshold} Confirmations
          </>
        ) : route ? (
          isInvalidVaa ? (
            <>
              There are not enough valid signatures to repair the VAA <br />{' '}
              Please reach out to Wormhole support on{' '}
              <a
                href="https://discord.com/invite/wormholecrypto"
                target="_blank"
                rel="noreferrer"
              >
                Discord
              </a>
            </>
          ) : (
            RoutesConfig[route].pendingMessage
          )
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

export default Confirmations;
