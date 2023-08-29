import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { CHAINS, TOKENS } from '../../config';
import { RootState } from '../../store';
import { setRoute } from '../../store/router';
import {
  setTxDetails,
  setSendTx,
  setRoute as setRedeemTransferRoute,
} from '../../store/redeem';
import { displayWalletAddress } from '../../utils';
import { LINK } from '../../utils/style';
import {
  registerWalletSigner,
  switchNetwork,
  TransferWallet,
} from '../../utils/wallet';
import { estimateClaimGasFees } from '../../utils/gasEstimates';
import Operator, { MessageInfo } from '../../utils/routes';
import { validate, isTransferValid } from '../../utils/transferValidation';
import {
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  setIsTransactionInProgress,
} from '../../store/transferInput';

import Button from '../../components/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AlertBanner from '../../components/AlertBanner';
import PoweredByIcon from '../../icons/PoweredBy';

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
    fromNetwork,
    toNetwork,
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
      const fromConfig = CHAINS[fromNetwork!];
      if (fromConfig?.context === Context.ETH) {
        registerWalletSigner(fromNetwork!, TransferWallet.SENDING);
        const { chainId } = CHAINS[fromNetwork!]!;
        await switchNetwork(chainId, TransferWallet.SENDING);
      }

      const tokenConfig = TOKENS[token]!;
      const sendToken = tokenConfig.tokenId;

      const operator = new Operator();
      const txId = await operator.send(
        route,
        sendToken || 'native',
        `${amount}`,
        fromNetwork!,
        sending.address,
        toNetwork!,
        receiving.address,
        { toNativeToken },
      );

      let messageInfo: MessageInfo | undefined;
      const toRedeem = setInterval(async () => {
        if (messageInfo) {
          const message = await operator.parseMessage(route, messageInfo);
          clearInterval(toRedeem);
          dispatch(setIsTransactionInProgress(false));
          dispatch(setSendTx(txId));
          dispatch(setTxDetails(message));
          dispatch(setRoute('redeem'));
          dispatch(setRedeemTransferRoute(route));
          setSendError('');
        } else {
          messageInfo = await operator.getMessageInfo(
            route,
            txId,
            fromNetwork!,
            true, // don't need to get the signed attestation
          );
        }
      }, 1000);
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

    const gasFee = await new Operator().estimateSendGas(
      route,
      sendToken || 'native',
      (amount || 0).toString(),
      fromNetwork!,
      sending.address,
      toNetwork!,
      receiving.address,
      { relayerFee, toNativeToken },
    );
    const isAutomatic = new Operator().getRoute(route).AUTOMATIC_DEPOSIT;
    if (isAutomatic) {
      dispatch(setAutomaticGasEst(gasFee));
    } else {
      dispatch(setManualGasEst(gasFee));
    }
  }, [
    token,
    amount,
    fromNetwork,
    sending,
    toNetwork,
    receiving,
    toNativeToken,
    relayerFee,
    dispatch,
    route,
  ]);

  const setDestGas = useCallback(async () => {
    if (!toNetwork) return;
    const gasFee = await estimateClaimGasFees(toNetwork!);
    dispatch(setClaimGasEst(gasFee));
  }, [toNetwork, dispatch]);

  useEffect(() => {
    const valid = isTransferValid(validations);
    if (!valid) return;

    setSendingGas();
    setDestGas();
  }, [
    validations,
    sending,
    receiving,
    fromNetwork,
    toNetwork,
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
    const r = new Operator().getRoute(route);
    return !r.AUTOMATIC_DEPOSIT;
  }, [route]);

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
              onClick={() => dispatch(setRoute('terms'))}
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
