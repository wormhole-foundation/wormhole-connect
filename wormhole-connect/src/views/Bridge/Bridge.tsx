import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { RootState } from 'store';
import { TransferInputState } from 'store/transferInput';
import config from 'config';
import { joinClass } from 'utils/style';
import { isTransferValid, useValidate } from 'utils/transferValidation';
import useConfirmBeforeLeaving from 'utils/confirmBeforeLeaving';

import NativeGasSlider from './NativeGasSlider';
import Preview from './Preview';
import Send from './Send';
import { Collapse, useTheme } from '@mui/material';
import PageHeader from 'components/PageHeader';
import FromInputs from './Inputs/From';
import ToInputs from './Inputs/To';
import SwapChains from './SwapChains';
import RouteOptions from './RouteOptions';
import ValidationError from './ValidationError';
import PoweredByIcon from 'icons/PoweredBy';
import { Alignment } from 'components/Header';
import FooterNavBar from 'components/FooterNavBar';
import useComputeDestinationTokens from 'hooks/useComputeDestinationTokens';
import useComputeQuote from 'hooks/useComputeQuote';
import useComputeSourceTokens from 'hooks/useComputeSourceTokens';
import { useFetchTokenPrices } from 'hooks/useFetchTokenPrices';
import { useGasSlider } from 'hooks/useGasSlider';
import { useConnectToLastUsedWallet } from 'utils/wallet';
import { useComputeReceiverNativeBalance } from 'hooks/useComputeReceiverNativeBalance';

const useStyles = makeStyles()((_theme) => ({
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bridgeContent: {
    margin: 'auto',
    maxWidth: '650px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
}));

function Bridge() {
  const { classes } = useStyles();
  const theme = useTheme();
  const {
    showValidationState,
    validations,
    fromChain,
    toChain,
    token,
    destToken,
    route,
    isTransactionInProgress,
    amount,
  }: TransferInputState = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { toNativeToken } = useSelector((state: RootState) => state.relay);
  const receiving = useSelector((state: RootState) => state.wallet.receiving);

  // Warn user before closing tab if transaction has begun
  useConfirmBeforeLeaving(isTransactionInProgress);

  // Compute and set destination native balance
  useComputeReceiverNativeBalance({
    sourceChain: fromChain,
    destChain: toChain,
    receiving,
  });

  // Compute and set source tokens
  useComputeSourceTokens({
    sourceChain: fromChain,
    destChain: toChain,
    sourceToken: token,
    destToken,
    route,
  });

  // Compute and set destination tokens
  useComputeDestinationTokens({
    sourceChain: fromChain,
    destChain: toChain,
    sourceToken: token,
    route,
  });

  // Compute and set quote
  useComputeQuote({
    sourceChain: fromChain,
    destChain: toChain,
    sourceToken: token,
    destToken,
    amount,
    route,
    toNativeToken,
  });

  useFetchTokenPrices();
  useConnectToLastUsedWallet();

  // validate transfer inputs
  useValidate();
  const valid = isTransferValid(validations);

  // Get Gas Slider props
  const { disabled, showGasSlider } = useGasSlider({
    destChain: toChain,
    destToken: destToken,
    route,
    valid,
    isTransactionInProgress,
  });

  const pageHeader = getPageHeader();

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      <PageHeader
        title={pageHeader.text}
        align={pageHeader.align}
        showHamburgerMenu={config.showHamburgerMenu}
      />
      <FromInputs />
      <SwapChains />
      <ToInputs />

      <ValidationError
        forceShow={
          !!fromChain && !!toChain && !!token && !!destToken && !!amount
        } // show route validation
        validations={[validations.route]}
        margin="12px 0 0 0"
      />

      <RouteOptions />
      <Collapse in={valid && showValidationState}>
        <div className={classes.spacer}>
          <Collapse
            in={showGasSlider}
            sx={
              !showGasSlider
                ? { marginBottom: '-16px', transition: 'margin 0.4s' }
                : {}
            }
          >
            {showGasSlider && <NativeGasSlider disabled={disabled} />}
          </Collapse>

          <Preview collapsed={!showValidationState ? true : !valid} />

          <Send valid={!!valid} />
        </div>
      </Collapse>
      {config.showHamburgerMenu ? null : <FooterNavBar />}

      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
}

const getPageHeader = (): { text: string; align: Alignment } => {
  const defaults: { text: string; align: Alignment } = {
    text: '',
    align: 'left',
  };
  if (typeof config.pageHeader === 'string') {
    return { ...defaults, text: config.pageHeader };
  } else {
    return { ...defaults, ...config.pageHeader };
  }
};

export default Bridge;
