import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Context, VaaInfo } from '@wormhole-foundation/wormhole-connect-sdk';
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
import {
  registerWalletSigner,
  switchNetwork,
  TransferWallet,
} from '../../utils/wallet';
import { validate, isTransferValid } from '../../utils/transferValidation';
import {
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  setIsTransactionInProgress,
  Route,
} from '../../store/transferInput';

import Button from '../../components/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AlertBanner from '../../components/AlertBanner';
import PoweredByIcon from '../../icons/PoweredBy';
import { LINK } from '../../utils/style';
import { estimateClaimGasFees } from '../../utils/gasEstimates';
import Operator from '../../utils/routes';

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
    route: routeType,
    automaticRelayAvail,
    isTransactionInProgress,
    route,
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

      let vaa: VaaInfo<any> | undefined;
      const toRedeem = setInterval(async () => {
        if (vaa) {
          const message = await operator.parseMessage(route, vaa);
          clearInterval(toRedeem);
          dispatch(setIsTransactionInProgress(false));
          dispatch(setSendTx(txId));
          dispatch(setTxDetails(message));
          dispatch(setRoute('redeem'));
          dispatch(setRedeemTransferRoute(route));
          setSendError('');
        } else {
          vaa = await operator.getVaa(route, txId, fromNetwork!);
        }
      }, 1000);
    } catch (e) {
      dispatch(setIsTransactionInProgress(false));
      setSendError('Error sending transfer, please try again');
      console.error(e);
    }
  }

  const setSendingGas = useCallback(
    async (routeType: Route) => {
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
      if (routeType === Route.BRIDGE) {
        dispatch(setManualGasEst(gasFee));
      } else {
        dispatch(setAutomaticGasEst(gasFee));
      }
    },
    [
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
    ],
  );

  // TODO: mock vaa?
  const setDestGas = useCallback(async () => {
    if (!toNetwork) return;
    const gasFee = await estimateClaimGasFees(toNetwork!);
    dispatch(setClaimGasEst(gasFee));
  }, [toNetwork, dispatch]);

  useEffect(() => {
    const valid = isTransferValid(validations);
    if (!valid) return;

    if (automaticRelayAvail) {
      setSendingGas(Route.RELAY);
    }
    setSendingGas(Route.BRIDGE);
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
    automaticRelayAvail,
    setDestGas,
    setSendingGas,
  ]);

  useEffect(() => {
    setIsConnected(
      sending.currentAddress.toLowerCase() === sending.address.toLowerCase(),
    );
  }, [sending]);

  return (
    <div className={classes.body}>
      {!!props.valid && (
        <AlertBanner
          show={
            showValidationState &&
            !!props.valid &&
            routeType === Route.BRIDGE &&
            toNetwork !== 'sei'
          }
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
