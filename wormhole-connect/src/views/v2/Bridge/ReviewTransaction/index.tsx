import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useMediaQuery, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';

import { RoutesConfig } from 'config/routes';
import useComputeQuoteV2 from 'hooks/useComputeQuoteV2';
import { useGasSlider } from 'hooks/useGasSlider';
import GasSlider from 'views/v2/Bridge/ReviewTransaction/GasSlider';
import SingleRoute from 'views/v2/Bridge/Routes/SingleRoute';

import type { RootState } from 'store';

const useStyles = makeStyles()((theme) => ({
  container: {
    gap: '16px',
    width: '100%',
    maxWidth: '420px',
  },
  confirmTransaction: {
    padding: '8px 16px',
    borderRadius: '8px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
}));

type Props = {
  onClose: () => void;
};

const ReviewTransaction = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    fromChain: sourceChain,
    toChain: destChain,
    token: sourceToken,
    destToken,
    amount,
    route,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);

  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const { disabled: isGasSliderDisabled, showGasSlider } = useGasSlider({
    destChain,
    destToken,
    route,
    valid: true,
    isTransactionInProgress,
  });

  // Compute the native gas to receive
  const { receiveNativeAmt } = useComputeQuoteV2({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route,
    toNativeToken,
  });

  const walletsConnected = useMemo(
    () => Boolean(sendingWallet.address) && Boolean(receivingWallet.address),
    [sendingWallet.address, receivingWallet.address],
  );

  // Review transaction button is shown only when everything is ready
  const confirmTransactionButton = useMemo(() => {
    if (
      !sourceChain ||
      !sourceToken ||
      !destChain ||
      !destToken ||
      !route ||
      !(Number(amount) > 0)
    ) {
      return null;
    }

    return (
      <Button
        variant="contained"
        color="primary"
        className={classes.confirmTransaction}
        onClick={() => undefined}
      >
        <Typography textTransform="none">
          {mobile ? 'Confirm' : 'Confirm transaction'}
        </Typography>
      </Button>
    );
  }, [sourceChain, sourceToken, destChain, destToken, route, amount]);

  if (!route || !walletsConnected) {
    return <></>;
  }

  return (
    <Stack className={classes.container}>
      <div>
        <IconButton onClick={() => props.onClose?.()}>
          <ChevronLeft />
        </IconButton>
      </div>
      <SingleRoute
        config={RoutesConfig[route]}
        available={true}
        isSelected={false}
        showDestinationGasFee
        title="You will receive"
      />
      <Collapse in={showGasSlider}>
        <GasSlider
          destinationGasFee={receiveNativeAmt}
          disabled={isGasSliderDisabled}
        />
      </Collapse>
      {confirmTransactionButton}
    </Stack>
  );
};

export default ReviewTransaction;
