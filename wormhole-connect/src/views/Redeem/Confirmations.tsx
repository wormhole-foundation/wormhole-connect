import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { LinearProgress, linearProgressClasses } from '@mui/material';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from '../../config';
import { getCurrentBlock } from '../../sdk';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
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

  const updateCurrentBlock = useCallback(async () => {
    const height = await getCurrentBlock(chain);
    setCurrentBlock(height);
  }, [chain]);

  useEffect(() => {
    updateCurrentBlock();
    const interval = setInterval(async () => {
      if (currentBlock < requiredHeight) {
        updateCurrentBlock();
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }, [currentBlock, requiredHeight, updateCurrentBlock]);

  const blockDiff =
    currentBlock > requiredHeight ? 0 : requiredHeight - currentBlock;
  const confirmations = chainConfig.finalityThreshold - blockDiff;
  const percentage = Math.floor(
    (confirmations / chainConfig.finalityThreshold) * 100,
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
        ) : (
          'Waiting for Wormhole Network consensus . . .'
        )}
      </div>
    </div>
  );
}

export default Confirmations;
