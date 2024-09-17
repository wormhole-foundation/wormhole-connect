import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';
import { poll } from 'poll';

import config from 'config';
import { LOCAL_STORAGE_TXS } from 'config/constants';
import ArrowRight from 'icons/ArrowRight';
import TokenIcon from 'icons/TokenIcons';
import { millisToHumanString } from 'utils';
import { toFixedDecimals } from 'utils/balance';

import type { TransactionLocal } from 'config/types';

const useStyles = makeStyles<{
  isFetching: boolean;
}>()((theme, { isFetching }) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
    boxShadow: `0px 0px 3.5px 0px ${
      isFetching ? theme.palette.success.main : theme.palette.primary.main
    }`,
  },
}));

type Props = {
  data: TransactionLocal;
};

const WidgetItem = (props: Props) => {
  const theme = useTheme();

  const [inProgress, setInProgress] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const { classes } = useStyles({ isFetching });

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

  const isMayanTx = useMemo(
    () => explorerInfo.name === 'Mayan Explorer',
    [explorerInfo.name],
  );

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
          if (isMayanTx) {
            txInProgress =
              resPayload?.clientStatus?.toLowerCase() !== 'completed';
          } else {
            const txData = resPayload?.operations?.[0];
            if (txData) {
              txInProgress =
                txData.sourceChain?.status?.toLowerCase() === 'confirmed' &&
                txData.targetChain?.status?.toLowerCase() !== 'completed';
            }
          }

          setInProgress(txInProgress);
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

    poll(fetchTransaction, 5000, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [explorerInfo.apiUrl]);

  useEffect(() => {
    if (!inProgress && txHash) {
      // Remove local storage item
      const lsItemId = `${LOCAL_STORAGE_TXS}${txHash}`;
      window.localStorage.removeItem(lsItemId);
      window.dispatchEvent(new Event('storage'));
    }
  }, [inProgress, txHash]);

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
              <Typography
                fontSize={14}
                justifyContent="space-between"
                color={theme.palette.text.secondary}
                display="flex"
              >
                {millisToHumanString(eta)}
              </Typography>
              <Stack direction="row" alignItems="center">
                <Typography fontSize={14} marginRight="8px">
                  {`${toFixedDecimals(amount, 4)} ${
                    config.tokens[tokenKey].symbol
                  }`}
                </Typography>
                <TokenIcon
                  icon={config.chains[sourceChain]?.icon}
                  height={24}
                />
                <ArrowRight fontSize="small" sx={{ margin: '0 4px' }} />
                <TokenIcon icon={config.chains[destChain]?.icon} height={24} />
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
};

export default WidgetItem;
