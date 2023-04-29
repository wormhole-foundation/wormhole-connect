import React, { useEffect, useState } from 'react';
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
  const chainConfig = CHAINS[props.chain]!;
  const requiredHeight = props.blockHeight + chainConfig.finalityThreshold;
  const [currentBlock, setCurrentBlock] = useState(0);

  //const updateCurrentBlock = async () => {
  //  const height = await getCurrentBlock(props.chain);
  //  setCurrentBlock(height);
  //};

  //useEffect(() => {
  //  updateCurrentBlock();
  //  const interval = setInterval(async () => {
  //    console.log(currentBlock, requiredHeight);
  //    if (currentBlock < requiredHeight) {
  //      updateCurrentBlock();
  //    } else {
  //      clearInterval(interval);
  //    }
  //  }, 1000);
  //}, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let currentBlock = 0;
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
  }, [requiredHeight, props.chain]);

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
        ) : (
          'Waiting for Wormhole Network consensus . . .'
        )}
      </div>
    </div>
  );
}

export default Confirmations;
