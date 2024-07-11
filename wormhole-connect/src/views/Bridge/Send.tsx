import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Context } from 'sdklegacy';
//import type { TokenId } from 'sdklegacy';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { RootState } from 'store';
import { setRoute as setAppRoute } from 'store/router';
import {
  setTxDetails,
  setSendTx,
  setRoute as setRedeemRoute,
} from 'store/redeem';
import {
  displayWalletAddress,
  getTokenDecimals,
  getWrappedToken,
  getWrappedTokenId,
} from 'utils';
import { LINK } from 'utils/style';
import {
  registerWalletSigner,
  switchChain,
  TransferWallet,
} from 'utils/wallet';
import RouteOperator from 'routes/operator';
import { validate, isTransferValid } from 'utils/transferValidation';
import {
  setSendingGasEst,
  setClaimGasEst,
  setIsTransactionInProgress,
} from 'store/transferInput';

import Button from 'components/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AlertBanner from 'components/AlertBanner';
import { isGatewayChain } from 'utils/cosmos';
import { useDebounce } from 'use-debounce';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { interpretTransferError } from 'utils/errors';
import { getTokenDetails } from 'telemetry';
import { RouteContext } from 'contexts/RouteContext';

const useStyles = makeStyles()((theme) => ({
  body: {
    width: '100%',
  },
  tosDisclaimer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
    marginLeft: 16,
    fontSize: '12px',
  },
  link: {
    ...LINK(theme),
    margin: '0 0 0 4px',
  },
}));

function Send(props: { valid: boolean }) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const transferInput = useSelector((state: RootState) => state.transferInput);
  const {
    showValidationState,
    validations,
    fromChain,
    toChain,
    token,
    destToken,
    amount,
    route,
    isTransactionInProgress,
    receiveAmount,
  } = transferInput;
  const [debouncedAmount] = useDebounce(amount, 500);

  const wallet = useSelector((state: RootState) => state.wallet);
  const { sending, receiving } = wallet;
  const relay = useSelector((state: RootState) => state.relay);
  const { toNativeToken, relayerFee, receiveNativeAmt } = relay;
  const [isConnected, setIsConnected] = useState(
    sending.currentAddress.toLowerCase() === sending.address.toLowerCase(),
  );
  const [sendError, setSendError] = useState('');

  const routeContext = useContext(RouteContext);

  async function send() {
    setSendError('');
    await validate({ transferInput, relay, wallet }, dispatch, () => false);
    const valid = isTransferValid(validations);
    if (!valid || !route) return;

    // Details for config.dispatchEvent events
    const transferDetails = {
      route,
      fromToken: getTokenDetails(token),
      toToken: getTokenDetails(destToken),
      fromChain: fromChain!,
      toChain: toChain!,
    };

    // Handle custom transfer validation (if provided by integrator)
    if (config.validateTransfer) {
      try {
        const { isValid, error } = await config.validateTransfer({
          ...transferDetails,
          fromWalletAddress: sending.address,
          toWalletAddress: receiving.address,
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

    const sendToken = config.tokens[token]!;

    try {
      const fromConfig = config.chains[fromChain!];
      if (fromConfig?.context === Context.ETH) {
        const chainId = fromConfig.chainId;
        if (typeof chainId !== 'number') {
          throw new Error('invalid evm chain ID');
        }
        await switchChain(chainId, TransferWallet.SENDING);
        await registerWalletSigner(fromChain!, TransferWallet.SENDING);
      }
      if (fromConfig?.context === Context.COSMOS) {
        await switchChain(fromConfig.chainId, TransferWallet.SENDING);
      }

      config.triggerEvent({
        type: 'transfer.initiate',
        details: transferDetails,
      });

      console.log('sending');
      const sendResult = await RouteOperator.send(
        route,
        sendToken,
        `${amount}`,
        fromChain!,
        sending.address,
        toChain!,
        receiving.address,
        destToken,
        { nativeGas: toNativeToken },
      );
      console.log('send done', sendResult);

      config.triggerEvent({
        type: 'transfer.start',
        details: transferDetails,
      });

      const [sdkRoute, receipt] = sendResult;
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
          sender: sending.address,
          amount,
          recipient: receiving.address,
          toChain: config.sdkConverter.toChainNameV1(receipt.to),
          fromChain: config.sdkConverter.toChainNameV1(receipt.from),
          tokenAddress: getWrappedToken(sendToken).tokenId!.address,
          tokenChain: config.sdkConverter.toChainNameV1(receipt.from),
          tokenId: getWrappedTokenId(sendToken),
          tokenKey: sendToken.key,
          tokenDecimals: getTokenDecimals(
            config.wh.toChainId(fromChain!),
            getWrappedTokenId(sendToken),
          ),
          receivedTokenKey: config.tokens[destToken].key!, // TODO: possibly wrong (e..g if portico swap fails)
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

      dispatch(setIsTransactionInProgress(false));
      dispatch(setSendTx(txId));
      dispatch(setRedeemRoute(route));
      dispatch(setAppRoute('redeem'));
      setSendError('');
    } catch (e: any) {
      console.error('Wormhole Connect: error completing transfer', e);
      dispatch(setIsTransactionInProgress(false));
      const [uiError, transferError] = interpretTransferError(e, fromChain!);

      // Show error in UI
      setSendError(uiError);

      // Trigger transfer error event to integrator
      config.triggerEvent({
        type: 'transfer.error',
        error: transferError,
        details: transferDetails,
      });
    }
  }

  const setSendingGas = useCallback(async () => {
    // this gas calculation uses the debounced amount to avoid spamming the rpc
    const tokenConfig = config.tokens[token]!;
    if (!route || !tokenConfig) return;
    const gasFee = '-';
    dispatch(setSendingGasEst(gasFee));
  }, [
    token,
    debouncedAmount,
    fromChain,
    sending,
    toChain,
    receiving,
    toNativeToken,
    relayerFee,
    dispatch,
    route,
  ]);

  const disabled = isTransactionInProgress || config.previewMode;

  const setDestGas = useCallback(async () => {
    if (!route || !toChain) return;
    // don't have vaa yet, so set that to undefined and it will get the fallback estimate
    const gasFee = '-';
    dispatch(setClaimGasEst(gasFee));
  }, [toChain, route, dispatch]);

  useEffect(() => {
    const valid = isTransferValid(validations);
    if (!valid) return;

    setSendingGas();
    setDestGas();
  }, [validations, setDestGas, setSendingGas]);

  useEffect(() => {
    setIsConnected(
      sending.currentAddress.toLowerCase() === sending.address.toLowerCase(),
    );
  }, [sending]);

  const showWarning = useMemo(() => {
    if (!route) return false;
    const r = RouteOperator.getRoute(route);
    return !(
      r.AUTOMATIC_DEPOSIT ||
      (toChain && isGatewayChain(toChain)) ||
      toChain === 'sei' ||
      isPorticoRoute(r.TYPE)
    );
  }, [route, toChain]);

  return (
    <div className={classes.body}>
      {!!props.valid && (
        <AlertBanner
          show={showValidationState && !!props.valid && showWarning}
          content="This transfer requires two transactions: one on the source chain and one on the destination chain. You will need gas on the destination chain."
          warning
          margin="0 0 16px 0"
        />
      )}

      <AlertBanner
        show={!!sendError}
        content={sendError}
        error
        margin="0 0 16px 0"
        testId="send-error-message"
      />
      {props.valid && !isConnected ? (
        <Button disabled elevated>
          Connect to {displayWalletAddress(sending.type!, sending.address)}
        </Button>
      ) : (
        <>
          <div className={classes.tosDisclaimer}>
            By proceeding, you agree to the
            <span
              className={classes.link}
              onClick={() => dispatch(setAppRoute('terms'))}
              rel="noreferrer"
            >
              Terms of Use
            </span>
          </div>
          <Button
            onClick={send}
            action={props.valid}
            disabled={disabled}
            testId="approve-button"
            elevated
          >
            {isTransactionInProgress ? (
              <CircularProgress size={22} />
            ) : (
              'Approve and proceed with transaction'
            )}
          </Button>
        </>
      )}
    </div>
  );
}

export default Send;
