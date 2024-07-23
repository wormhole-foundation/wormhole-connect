import React, { useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useMediaQuery, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import { getTokenDetails } from 'telemetry';
import { Context } from 'sdklegacy';

import AlertBanner from 'components/AlertBanner';
import config from 'config';
import { RoutesConfig } from 'config/routes';
import { RouteContext } from 'contexts/RouteContext';
import useComputeQuoteV2 from 'hooks/useComputeQuoteV2';
import { useGasSlider } from 'hooks/useGasSlider';
import RouteOperator from 'routes/operator';
import {
  setTxDetails,
  setSendTx,
  setRoute as setRedeemRoute,
} from 'store/redeem';
import { setRoute as setAppRoute } from 'store/router';
import { setIsTransactionInProgress } from 'store/transferInput';
import { getTokenDecimals, getWrappedToken, getWrappedTokenId } from 'utils';
import { interpretTransferError } from 'utils/errors';
import { validate, isTransferValid } from 'utils/transferValidation';
import {
  registerWalletSigner,
  switchChain,
  TransferWallet,
} from 'utils/wallet';
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
  const dispatch = useDispatch();
  const theme = useTheme();

  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [sendError, setSendError] = useState('');

  const routeContext = useContext(RouteContext);

  const transferInput = useSelector((state: RootState) => state.transferInput);

  const {
    amount,
    fromChain: sourceChain,
    toChain: destChain,
    token: sourceToken,
    destToken,
    isTransactionInProgress,
    receiveAmount,
    route,
    validations,
  } = transferInput;

  const wallet = useSelector((state: RootState) => state.wallet);
  const { sending: sendingWallet, receiving: receivingWallet } = wallet;

  const relay = useSelector((state: RootState) => state.relay);
  const { relayerFee, toNativeToken } = relay;

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

  const send = async () => {
    setSendError('');

    // Pre-check of required values
    if (
      !sourceChain ||
      !sourceToken ||
      !destChain ||
      !destToken ||
      !amount ||
      !route
    ) {
      return;
    }

    await validate({ transferInput, relay, wallet }, dispatch, () => false);

    const valid = isTransferValid(validations);

    if (!valid || !route) {
      return;
    }

    // Details for config.dispatchEvent events
    const transferDetails = {
      route,
      fromToken: getTokenDetails(sourceToken),
      toToken: getTokenDetails(destToken),
      fromChain: sourceChain,
      toChain: destChain,
    };

    // Handle custom transfer validation (if provided by integrator)
    if (config.validateTransfer) {
      try {
        const { isValid, error } = await config.validateTransfer({
          ...transferDetails,
          fromWalletAddress: sendingWallet.address,
          toWalletAddress: receivingWallet.address,
        });
        if (!isValid) {
          setSendError(error ?? 'Transfer validation failed');
          return;
        }
      } catch (e) {
        setSendError('Error validating transfer');
        console.error(e);
        return;
      }
    }

    dispatch(setIsTransactionInProgress(true));

    const sourceTokenConfig = config.tokens[sourceToken];

    try {
      const fromConfig = config.chains[sourceChain!];

      if (fromConfig?.context === Context.ETH) {
        const chainId = fromConfig.chainId;

        if (typeof chainId !== 'number') {
          throw new Error('Invalid EVM chain ID');
        }

        await switchChain(chainId, TransferWallet.SENDING);
        await registerWalletSigner(sourceChain, TransferWallet.SENDING);
      }

      if (fromConfig?.context === Context.COSMOS) {
        await switchChain(fromConfig.chainId, TransferWallet.SENDING);
      }

      config.triggerEvent({
        type: 'transfer.initiate',
        details: transferDetails,
      });

      const [sdkRoute, receipt] = await RouteOperator.send(
        route,
        sourceTokenConfig,
        amount,
        sourceChain,
        sendingWallet.address,
        destChain,
        receivingWallet.address,
        destToken,
        { nativeGas: toNativeToken },
      );

      config.triggerEvent({
        type: 'transfer.start',
        details: transferDetails,
      });

      let txId = '';
      if ('originTxs' in receipt) {
        txId = receipt.originTxs[receipt.originTxs.length - 1].txid;
      } else {
        throw new Error("Can't find txid in receipt");
      }

      // TODO: SDKV2 set the tx details using on-chain data
      // because they might be different than what we have in memory (relayer fee)
      // or we may not have all the data (e.g. block)
      // TODO: we don't need all of these details
      // The SDK should provide a way to get the details from the chain (e.g. route.lookupSourceTxDetails)
      dispatch(
        setTxDetails({
          sendTx: txId,
          sender: sendingWallet.address,
          amount,
          recipient: receivingWallet.address,
          toChain: config.sdkConverter.toChainNameV1(receipt.to),
          fromChain: config.sdkConverter.toChainNameV1(receipt.from),
          tokenAddress: getWrappedToken(sourceTokenConfig).tokenId!.address,
          tokenChain: config.sdkConverter.toChainNameV1(receipt.from),
          tokenId: getWrappedTokenId(sourceTokenConfig),
          tokenKey: sourceTokenConfig.key,
          tokenDecimals: getTokenDecimals(
            config.wh.toChainId(sourceChain),
            getWrappedTokenId(sourceTokenConfig),
          ),
          receivedTokenKey: config.tokens[destToken].key, // TODO: possibly wrong (e..g if portico swap fails)
          emitterAddress: undefined,
          sequence: undefined,
          block: 0,
          gasFee: undefined,
          payload: undefined,
          inputData: undefined,
          relayerFee,
          receiveAmount: receiveAmount.data || '',
          receiveNativeAmount: receiveNativeAmt,
        }),
      );

      routeContext.setRoute(sdkRoute);
      routeContext.setReceipt(receipt);

      dispatch(setSendTx(txId));
      dispatch(setRedeemRoute(route));
      dispatch(setAppRoute('redeem'));
      setSendError('');
    } catch (e: any) {
      console.error('Wormhole Connect: error completing transfer', e);

      const [uiError, transferError] = interpretTransferError(e, sourceChain);

      // Show error in UI
      setSendError(uiError);

      // Trigger transfer error event to integrator
      config.triggerEvent({
        type: 'transfer.error',
        error: transferError,
        details: transferDetails,
      });
    } finally {
      dispatch(setIsTransactionInProgress(false));
    }
  };

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
        disabled={isTransactionInProgress}
        variant="contained"
        color="primary"
        className={classes.confirmTransaction}
        onClick={() => send()}
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
      <AlertBanner
        show={!!sendError}
        content={sendError}
        error
        margin="0 0 16px 0"
        testId="send-error-message"
      />
      {confirmTransactionButton}
    </Stack>
  );
};

export default ReviewTransaction;
