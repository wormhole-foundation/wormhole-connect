import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { CHAINS, TOKENS } from 'config';
import { RootState } from 'store';
import { setRoute as setAppRoute } from 'store/router';
import {
  setTxDetails,
  setSendTx,
  setRoute as setRedeemRoute,
} from 'store/redeem';
import { displayWalletAddress, sleep } from 'utils';
import { LINK } from 'utils/style';
import {
  registerWalletSigner,
  switchNetwork,
  TransferWallet,
} from 'utils/wallet';
import RouteOperator, { UnsignedMessage } from 'utils/routes';
import { validate, isTransferValid } from 'utils/transferValidation';
import {
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  setIsTransactionInProgress,
} from 'store/transferInput';

import Button from 'components/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AlertBanner from 'components/AlertBanner';
import PoweredByIcon from 'icons/PoweredBy';
import { isCosmWasmChain } from 'utils/cosmos';
import { estimateClaimGas, estimateSendGas } from 'utils/gas';

const useStyles = makeStyles()((theme) => ({
  body: {
    width: '100%',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
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
  const theme = useTheme();
  const dispatch = useDispatch();
  const wallets = useSelector((state: RootState) => state.wallet);
  const { sending, receiving } = wallets;
  const transfer = useSelector((state: RootState) => state.transferInput);
  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const {
    validate: showValidationState,
    validations,
    fromChain,
    toChain,
    token,
    amount,
    route,
    isTransactionInProgress,
  } = transfer;
  const [isConnected, setIsConnected] = useState(
    sending.currentAddress.toLowerCase() === sending.address.toLowerCase(),
  );
  const [sendError, setSendError] = useState('');

  async function send() {
    setSendError('');
    await validate(dispatch);
    const valid = isTransferValid(validations);
    if (!valid) return;
    dispatch(setIsTransactionInProgress(true));

    try {
      const fromConfig = CHAINS[fromChain!];
      if (fromConfig?.context === Context.ETH) {
        registerWalletSigner(fromChain!, TransferWallet.SENDING);
        const chainId = CHAINS[fromChain!]!.chainId;
        if (typeof chainId !== 'number') {
          throw new Error('invalid evm chain ID');
        }
        await switchNetwork(chainId, TransferWallet.SENDING);
      }

      const tokenConfig = TOKENS[token]!;
      const sendToken = tokenConfig.tokenId;

      const txId = await RouteOperator.send(
        route,
        sendToken || 'native',
        `${amount}`,
        fromChain!,
        sending.address,
        toChain!,
        receiving.address,
        { toNativeToken },
      );

      let message: UnsignedMessage | undefined;
      while (message === undefined) {
        try {
          message = await RouteOperator.getMessage(
            route,
            txId,
            fromChain!,
            true, // don't need to get the signed attestation
          );
        } catch (e) {}
        if (message === undefined) {
          await sleep(3000);
        }
      }
      dispatch(setIsTransactionInProgress(false));
      dispatch(setSendTx(txId));
      dispatch(setTxDetails(message));
      dispatch(setRedeemRoute(route));
      dispatch(setAppRoute('redeem'));
      setSendError('');
    } catch (e) {
      dispatch(setIsTransactionInProgress(false));
      setSendError('Error sending transfer, please try again');
      console.error(e);
    }
  }

  const setSendingGas = useCallback(async () => {
    const tokenConfig = TOKENS[token]!;
    if (!tokenConfig) return;
    const sendToken = tokenConfig.tokenId;

    const gasFee = await estimateSendGas(
      route,
      sendToken || 'native',
      (amount || 0).toString(),
      fromChain!,
      sending.address,
      toChain!,
      receiving.address,
      { relayerFee, toNativeToken },
    );
    const isAutomatic = RouteOperator.getRoute(route).AUTOMATIC_DEPOSIT;
    if (isAutomatic) {
      dispatch(setAutomaticGasEst(gasFee));
    } else {
      dispatch(setManualGasEst(gasFee));
    }
  }, [
    token,
    amount,
    fromChain,
    sending,
    toChain,
    receiving,
    toNativeToken,
    relayerFee,
    dispatch,
    route,
  ]);

  const setDestGas = useCallback(async () => {
    if (!toChain) return;
    // TODO:
    const gasFee = await estimateClaimGas(route, toChain!, undefined);
    dispatch(setClaimGasEst(gasFee));
  }, [toChain, route, dispatch]);

  useEffect(() => {
    const valid = isTransferValid(validations);
    if (!valid) return;

    setSendingGas();
    setDestGas();
  }, [
    validations,
    sending,
    receiving,
    fromChain,
    toChain,
    token,
    route,
    toNativeToken,
    relayerFee,
    setDestGas,
    setSendingGas,
  ]);

  useEffect(() => {
    setIsConnected(
      sending.currentAddress.toLowerCase() === sending.address.toLowerCase(),
    );
  }, [sending]);

  const showWarning = useMemo(() => {
    const r = RouteOperator.getRoute(route);
    return !(r.AUTOMATIC_DEPOSIT || (toChain && isCosmWasmChain(toChain)));
  }, [route, toChain]);

  return (
    <div className={classes.body}>
      {!!props.valid && (
        <AlertBanner
          show={showValidationState && !!props.valid && showWarning}
          content="This transfer will require two transactions - one on the source chain and one on the destination chain."
          warning
          margin="0 0 16px 0"
        />
      )}

      <AlertBanner
        show={!!sendError}
        content={sendError}
        error
        margin="0 0 16px 0"
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
            disabled={isTransactionInProgress}
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

      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
}

export default Send;
