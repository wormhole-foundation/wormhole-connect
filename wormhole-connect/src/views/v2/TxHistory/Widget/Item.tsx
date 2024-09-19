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
import { poll } from 'poll';

import config from 'config';
import { LOCAL_STORAGE_TX } from 'config/constants';
import ArrowRight from 'icons/ArrowRight';
import TokenIcon from 'icons/TokenIcons';
import TxCompleteIcon from 'icons/TxComplete';
import { minutesAndSecondsWithPadding } from 'utils/transferValidation';
import { toFixedDecimals } from 'utils/balance';

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
  chainIcon: {
    background: theme.palette.background.default,
    border: `2px solid ${theme.palette.modal.background}`,
    borderRadius: '6px',
    padding: '2px',
  },
  completedIcon: { height: '24px', width: '24px' },
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
  const [senderTimestamp, setSenderTimestamp] = useState('');
  const [etaExpired, setEtaExpired] = useState(false);
  const [inProgress, setInProgress] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const { classes } = useStyles();

  const { data: transaction } = props;
  const {
    txHash,
    eta,
    explorerInfo,
    amount,
    sourceChain,
    destChain,
    tokenKey,
  } = transaction;

  // Initialize the countdown
  const { seconds, minutes, totalSeconds, isRunning, restart } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => setEtaExpired(true),
  });

  // Check whether the current transaction is from Mayan API
  // We need this to parse the API response accordingly
  const isMayanTx = useMemo(
    () => explorerInfo.apiUrl.startsWith(config.mayanApi),
    [explorerInfo.apiUrl],
  );

  // Side-effect to poll the transaction info from the respective API
  useEffect(() => {
    if (!transaction) {
      return;
    }

    let cancelled = false;

    const fetchTransaction = async () => {
      setIsFetching(true);

      try {
        const res = await fetch(explorerInfo.apiUrl);
        const resPayload = await res.json();

        if (!cancelled) {
          let txInProgress = true;
          let txSenderTimestamp = '';
          if (isMayanTx) {
            txInProgress =
              resPayload?.clientStatus?.toLowerCase() !== 'completed' &&
              resPayload?.clientStatus?.toLowerCase() !== 'refunded';
            txSenderTimestamp = resPayload?.initiatedAt;
          } else {
            const txData = resPayload?.operations?.[0];
            if (txData) {
              txInProgress =
                txData.sourceChain?.status?.toLowerCase() === 'confirmed' &&
                txData.targetChain?.status?.toLowerCase() !== 'completed';
              txSenderTimestamp = txData.sourceChain?.timestamp;
            }
          }

          setInProgress(txInProgress);
          setSenderTimestamp(txSenderTimestamp);
        }
      } catch (error) {
        if (!cancelled) {
          console.log(
            `Error fetching transaction history from Mayan: ${error}`,
          );
        }
      } finally {
        setIsFetching(false);
      }
    };

    poll(fetchTransaction, 5000, () => cancelled || !inProgress);

    return () => {
      cancelled = true;
    };
  }, [explorerInfo.apiUrl]);

  useEffect(() => {
    if (!inProgress && txHash) {
      // Remove local storage item
      const lsItemId = `${LOCAL_STORAGE_TX}${txHash}`;
      window.localStorage.removeItem(lsItemId);
    }
  }, [inProgress, txHash]);

  // Sender time in milliseconds
  const senderTime = useMemo(() => {
    if (!senderTimestamp) {
      return 0;
    }

    return new Date(senderTimestamp).getTime();
  }, [senderTimestamp]);

  // Remaining from the original ETA since the creation of this transaction
  const etaRemaining = useMemo(() => {
    if (!senderTime) {
      // We need the sender timestamp to be able to calculate the remaining time
      // Otherwise do not render the remaining eta counter
      return 0;
    }

    const timePassed = Date.now() - senderTime;

    if (eta < timePassed) {
      return 0;
    }

    return eta - timePassed;
  }, [senderTime, eta, totalSeconds]);

  // Displays the countdown
  const etaCountdown = useMemo(() => {
    if (etaExpired) {
      return 'Any time now!';
    }

    if (isRunning) {
      return minutesAndSecondsWithPadding(minutes, seconds);
    }

    return <CircularProgress size={16} />;
  }, [etaExpired, isRunning, minutes, seconds, senderTime, isFetching]);

  // A number value between 0-100
  const progressBarValue = useMemo(() => {
    // etaRemaining is guaranteed to be smaller than or equal to eta,
    // but we still check here as well to be on the safe side.
    if (etaRemaining > eta) {
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
  }, [eta, etaRemaining, inProgress]);

  // Start the countdown timer
  useEffect(() => {
    if (!isRunning && inProgress && etaRemaining) {
      // Start only when:
      //   1- the timer hasn't been started yet and
      //   2- transaction is in progress and
      //   3- we have the remaining eta
      restart(new Date(Date.now() + etaRemaining), true);
    }
  }, [etaRemaining, inProgress]);

  if (!transaction) {
    return <></>;
  }

  return (
    <div key={txHash} className={classes.container}>
      <Card className={classes.card}>
        <CardActionArea
          disableTouchRipple
          onClick={() => {
            window.open(explorerInfo.url, '_blank');
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography display="flex" justifyContent="space-between">
                {inProgress ? (
                  etaCountdown
                ) : (
                  <TxCompleteIcon className={classes.completedIcon} />
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
                    icon={config.chains[sourceChain]?.icon}
                    height={24}
                  />
                </Box>
                <ArrowRight className={classes.arrowIcon} />
                <Box className={classes.chainIcon}>
                  <TokenIcon
                    icon={config.chains[destChain]?.icon}
                    height={24}
                  />
                </Box>
              </Stack>
            </Stack>
            {inProgress && (
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
