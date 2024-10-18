import React, { useEffect, useMemo, useState } from 'react';
import { useTimer } from 'react-timer-hook';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import useTrackTransferInProgress from 'hooks/useTrackTransferInProgress';
import useResumeTransaction from 'hooks/useResumeTransaction';
import ArrowRight from 'icons/ArrowRight';
import TokenIcon from 'icons/TokenIcons';
import TxCompleteIcon from 'icons/TxComplete';
import { toFixedDecimals } from 'utils/balance';
import { removeTxFromLocalStorage } from 'utils/inProgressTxCache';
import { minutesAndSecondsWithPadding } from 'utils/transferValidation';

import type { TransactionLocal } from 'config/types';

const useStyles = makeStyles()((theme: any) => ({
  arrowIcon: {
    fontSize: '16px',
    margin: '0 4px',
  },
  card: {
    width: '100%',
    boxShadow: `0px 0px 3.5px 0px ${theme.palette.primary.main}`,
  },
  cardActionArea: {
    height: '76px',
  },
  chainIcon: {
    background: theme.palette.background.default,
    border: `2px solid ${theme.palette.modal.background}`,
    borderRadius: '6px',
    padding: '2px',
  },
  completedIcon: {
    color: theme.palette.success.main,
    height: '24px',
    width: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  progressBar: {
    borderRadius: '4px',
    marginTop: '8px',
  },
}));

type Props = {
  data: TransactionLocal;
};

const WidgetItem = (props: Props) => {
  const [etaExpired, setEtaExpired] = useState(false);
  const [resumeTxLocal, setResumeTxLocal] = useState<
    TransactionLocal | undefined
  >();

  const { classes } = useStyles();

  const { data: transaction } = props;
  const { receipt, route, timestamp, txDetails, txHash } = transaction;
  const { amount, eta, fromChain, toChain, tokenKey } = txDetails || {};

  // Initialize the countdown
  const { seconds, minutes, totalSeconds, isRunning, restart } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => setEtaExpired(true),
  });

  const { isCompleted } = useTrackTransferInProgress({
    eta,
    receipt,
    route,
  });

  const { isLoading: isLoadingResume } = useResumeTransaction(resumeTxLocal);

  useEffect(() => {
    if (isCompleted && txHash) {
      // Remove this transaction from local storage
      removeTxFromLocalStorage(txHash);
    }
  }, [isCompleted, txHash]);

  // Remaining from the original ETA since the creation of this transaction
  const etaRemaining = useMemo(() => {
    if (!eta || !timestamp) {
      // We need the sender timestamp to be able to calculate the remaining time
      // Otherwise do not render the remaining eta counter
      return 0;
    }

    const timePassed = Date.now() - timestamp;

    if (eta < timePassed) {
      return 0;
    }

    return eta - timePassed;
  }, [eta, timestamp, totalSeconds]);

  // Displays the countdown
  const etaCountdown = useMemo(() => {
    if (etaExpired || etaRemaining === 0) {
      return 'Wrapping up...';
    }

    if (isRunning) {
      return minutesAndSecondsWithPadding(minutes, seconds);
    }

    return <CircularProgress size={16} />;
  }, [etaExpired, etaRemaining, isRunning, minutes, seconds]);

  // A number value between 0-100
  const progressBarValue = useMemo(() => {
    // etaRemaining is guaranteed to be smaller than or equal to eta,
    // but we still check here as well to be on the safe side.
    if (!eta || etaRemaining > eta) {
      return 0;
    }

    // Return empty bar when computing the remaining eta and counter is running
    if (!etaExpired && etaRemaining === 0) {
      return 0;
    }

    // Return full bar when countdown expires
    if (etaExpired) {
      return 100;
    }

    return ((eta - etaRemaining) / eta) * 100;
  }, [eta, etaRemaining, isCompleted]);

  // Start the countdown timer
  useEffect(() => {
    if (!isRunning && !isCompleted && etaRemaining) {
      // Start only when:
      //   1- the timer hasn't been started yet and
      //   2- transaction is in progress and
      //   3- we have the remaining eta
      restart(new Date(Date.now() + etaRemaining), true);
    }
  }, [etaRemaining, isCompleted, isRunning]);

  if (!transaction) {
    return <></>;
  }

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardActionArea
          disableTouchRipple
          disabled={isLoadingResume || !txDetails}
          className={classes.cardActionArea}
          onClick={async () => {
            setResumeTxLocal({
              txDetails,
              timestamp,
              route,
              receipt,
              txHash,
            });
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography display="flex" justifyContent="space-between">
                {isCompleted ? (
                  <TxCompleteIcon className={classes.completedIcon} />
                ) : (
                  etaCountdown
                )}
              </Typography>
              <Stack direction="row" alignItems="center">
                <Typography fontSize={14} marginRight="8px">
                  {`${toFixedDecimals(amount, 4)} ${
                    config.tokens[tokenKey].symbol
                  }`}
                </Typography>
                <Box className={classes.chainIcon}>
                  <TokenIcon
                    icon={config.chains[fromChain]?.icon}
                    height={24}
                  />
                </Box>
                <ArrowRight className={classes.arrowIcon} />
                <Box className={classes.chainIcon}>
                  <TokenIcon icon={config.chains[toChain]?.icon} height={24} />
                </Box>
              </Stack>
            </Stack>
            {!isCompleted && (
              <LinearProgress
                className={classes.progressBar}
                variant="determinate"
                value={progressBarValue}
              />
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
};

export default WidgetItem;
