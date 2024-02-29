import CircularProgress from '@mui/material/CircularProgress';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CHAINS } from 'config';
import { RootState } from 'store';
import {
  setTransferDestInfo,
  setRedeemTx,
  setTransferComplete,
  setTxDetails,
} from 'store/redeem';
import { displayAddress, getTokenById, getWrappedTokenId } from 'utils';
import RouteOperator from 'routes/operator';
import {
  TransferWallet,
  registerWalletSigner,
  switchChain,
  signAndSendTransaction,
} from 'utils/wallet';

import AlertBanner from 'components/AlertBanner';
import Button from 'components/Button';
import InputContainer from 'components/InputContainer';
import { RenderRows } from 'components/RenderRows';
import Spacer from 'components/Spacer';
import WalletsModal from '../WalletModal';
import Header from './Header';
import { estimateClaimGas } from 'utils/gas';
import { isGatewayChain } from '../../utils/cosmos';
import { PayloadType, solanaContext } from '../../utils/sdk';
import { AssociatedTokenWarning } from '../Bridge/Inputs/TokenWarnings';
import { Route } from 'config/types';
import SwitchToManualClaim from './SwitchToManualClaim';
import { isPorticoRoute } from 'routes/porticoBridge/utils';

function AssociatedTokenAlert() {
  const dispatch = useDispatch();
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const wallet = useSelector((state: RootState) => state.wallet.receiving);

  const createAssociatedTokenAccount = useCallback(async () => {
    const token = getTokenById(txData.tokenId);
    if (!token) return;
    const tokenId = getWrappedTokenId(token);
    const tx = await solanaContext().createAssociatedTokenAccount(
      tokenId,
      wallet.address,
      'finalized',
    );
    // if `tx` is null it means the account already exists
    if (!tx) return;
    await signAndSendTransaction('solana', tx, TransferWallet.RECEIVING);
    dispatch(setTxDetails({ ...txData, recipient: wallet.address }));
  }, [txData, wallet.address, dispatch]);

  const content = (
    <AssociatedTokenWarning
      createAssociatedTokenAccount={createAssociatedTokenAccount}
    />
  );

  return <AlertBanner warning show={!!wallet.address} content={content} />;
}

function SendTo() {
  const dispatch = useDispatch();
  const {
    redeemTx,
    transferComplete,
    route: routeName,
    signedMessage,
  } = useSelector((state: RootState) => state.redeem);
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const wallet = useSelector((state: RootState) => state.wallet.receiving);
  const transferDestInfo = useSelector(
    (state: RootState) => state.redeem.transferDestInfo,
  );
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const [claimError, setClaimError] = useState('');
  const [manualClaim, setManualClaim] = useState(false);

  const connect = () => {
    setWalletModal(true);
  };

  const checkConnection = useCallback(() => {
    if (!txData) return;
    const addr = wallet.address.toLowerCase();
    const curAddr = wallet.currentAddress.toLowerCase();
    const reqAddr = txData.recipient.toLowerCase();
    return addr === curAddr && addr === reqAddr;
  }, [wallet, txData]);

  const onSwitchToManualClaim = useCallback((checked: boolean) => {
    setManualClaim(checked);
  }, []);

  const [inProgress, setInProgress] = useState(false);
  const [isConnected, setIsConnected] = useState(checkConnection());
  const [openWalletModal, setWalletModal] = useState(false);

  // get the redeem tx, for automatic transfers only
  const getRedeemTx = useCallback(async () => {
    if (!routeName) return;
    if (redeemTx) return redeemTx;
    if (signedMessage && routeName) {
      const redeemedTransactionHash = await RouteOperator.tryFetchRedeemTx(
        routeName,
        signedMessage,
      );
      if (redeemedTransactionHash) {
        dispatch(setRedeemTx(redeemedTransactionHash));
        return redeemedTransactionHash;
      }
    }
  }, [redeemTx, routeName, signedMessage, dispatch]);

  useEffect(() => {
    if (!txData || !routeName) return;
    const populate = async () => {
      let receiveTx: string | undefined;
      try {
        receiveTx = await getRedeemTx();
      } catch (e) {
        console.error(`could not fetch redeem event:\n${e}`);
      }
      let gasEstimate;
      if (!receiveTx) {
        gasEstimate = await estimateClaimGas(
          routeName,
          txData.toChain,
          signedMessage,
        );
      }
      dispatch(setTransferDestInfo(undefined));
      try {
        const info = await RouteOperator.getTransferDestInfo(routeName, {
          txData,
          tokenPrices: prices,
          receiveTx,
          transferComplete,
          gasEstimate,
        });
        dispatch(setTransferDestInfo(info));
      } catch (e) {
        console.error(e);
      }
    };
    populate();
  }, [
    transferComplete,
    getRedeemTx,
    txData,
    routeName,
    signedMessage,
    dispatch,
    data,
  ]);

  useEffect(() => {
    setIsConnected(checkConnection());
  }, [wallet, checkConnection]);

  const AUTOMATIC_DEPOSIT = useMemo(() => {
    if (!routeName) return false;
    const route = RouteOperator.getRoute(routeName);
    return (
      route.AUTOMATIC_DEPOSIT ||
      isGatewayChain(txData.toChain) ||
      txData.toChain === 'sei' ||
      isPorticoRoute(route.TYPE)
    );
  }, [routeName, txData]);

  const claim = async () => {
    setInProgress(true);
    setClaimError('');
    if (!routeName) {
      throw new Error('Unknown route, cannot claim');
    }
    if (!wallet || !isConnected) {
      setClaimError('Connect to receiving wallet');
      throw new Error('Connect to receiving wallet');
    }
    const chainConfig = CHAINS[txData.toChain]!;
    if (!chainConfig) {
      setClaimError('Your claim has failed, please try again');
      throw new Error('invalid destination chain');
    }
    try {
      if (
        chainConfig!.context === Context.ETH &&
        typeof chainConfig.chainId === 'number'
      ) {
        registerWalletSigner(txData.toChain, TransferWallet.RECEIVING);
        await switchChain(chainConfig.chainId, TransferWallet.RECEIVING);
      }
      if (!signedMessage) {
        throw new Error('failed to get vaa, cannot redeem');
      }
      const txId = await RouteOperator.redeem(
        routeName,
        txData.toChain,
        signedMessage,
        wallet.address,
      );
      dispatch(setRedeemTx(txId));
      dispatch(setTransferComplete(true));
      setInProgress(false);
      setClaimError('');
    } catch (e) {
      setInProgress(false);
      setClaimError('Your claim has failed, please try again');
      console.error(e);
    }
  };

  // sometimes the ATA might be closed even after the transfer began
  const missingATA =
    txData.recipient === '' &&
    txData.toChain === 'solana' &&
    txData.payloadID === PayloadType.Manual;

  const loading = !AUTOMATIC_DEPOSIT
    ? inProgress && !transferComplete
    : !transferComplete && !manualClaim;
  const manualClaimText =
    transferComplete || AUTOMATIC_DEPOSIT // todo: should be the other enum, should be named better than payload id
      ? ''
      : claimError
      ? 'Error please retry . . .'
      : 'Claim below';
  const showSwitchToManualClaim =
    !transferComplete &&
    (routeName === Route.Relay || isPorticoRoute(routeName as Route));
  let manualClaimTitle = '';
  if (showSwitchToManualClaim) {
    manualClaimTitle =
      'This option avoids the relayer fee but requires you to pay the gas fee on the destination chain.';
    if (routeName === Route.Relay) {
      manualClaimTitle += ' You will not receive any native gas.';
    }
  }
  return (
    <div>
      <InputContainer>
        <Header
          chain={txData.toChain}
          address={txData.recipient}
          loading={loading}
          txHash={redeemTx}
          text={manualClaimText}
        />
        <>
          {showSwitchToManualClaim && (
            <SwitchToManualClaim
              checked={manualClaim}
              onChange={onSwitchToManualClaim}
              disabled={inProgress}
              title={manualClaimTitle}
            />
          )}
        </>
        <RenderRows rows={transferDestInfo?.displayData || []} />
      </InputContainer>

      {missingATA && (
        <>
          <Spacer height={8} />
          <AssociatedTokenAlert />
        </>
      )}

      {/* Claim button for manual transfers */}
      {!transferComplete && (!AUTOMATIC_DEPOSIT || manualClaim) && (
        <>
          <Spacer height={8} />
          <AlertBanner
            show={!!claimError}
            content={claimError}
            error
            margin="0 0 12px 0"
          />
          {wallet.address ? (
            isConnected ? (
              <Button onClick={claim} action disabled={inProgress}>
                {inProgress ? <CircularProgress size={22} /> : 'Claim'}
              </Button>
            ) : (
              <Button onClick={connect} elevated>
                Connect to {displayAddress(txData.toChain, txData.recipient)}
              </Button>
            )
          ) : (
            <Button onClick={connect} action>
              Connect wallet
            </Button>
          )}
        </>
      )}
      {openWalletModal && (
        <WalletsModal
          type={TransferWallet.RECEIVING}
          chain={txData.toChain}
          onClose={() => setWalletModal(false)}
        />
      )}
      {/* {pending && <Confirmations confirmations={vaa.guardianSignatures} />} */}
    </div>
  );
}

export default SendTo;
