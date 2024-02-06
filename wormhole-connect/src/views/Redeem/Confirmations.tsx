import { LinearProgress, linearProgressClasses } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { CHAINS } from 'config';
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
  const chainConfig = CHAINS[chain]!;
  const requiredHeight = blockHeight + chainConfig.finalityThreshold;
  const [currentBlock, setCurrentBlock] = useState(0);

  const { route } = useSelector((state: RootState) => state.redeem);

  useEffect(() => {
    if (chainConfig.finalityThreshold === 0) {
      return;
    }
    let cancelled = false;
    (async () => {
      const currentBlock = 0;
      while (currentBlock < requiredHeight && !cancelled) {
        const currentBlock = await getCurrentBlock(props.chain);
        if (!cancelled) {
          setCurrentBlock(currentBlock);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requiredHeight, props.chain, chainConfig.finalityThreshold]);

  const blockDiff =
    currentBlock > requiredHeight ? 0 : requiredHeight - currentBlock;
  const confirmations = chainConfig.finalityThreshold - blockDiff;
  const percentage =
    chainConfig.finalityThreshold === 0
      ? 100
      : Math.floor((confirmations / chainConfig.finalityThreshold) * 100);

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
          RoutesConfig[route].pendingMessage
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

export default Confirmations;
