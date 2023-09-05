import CircularProgress from '@mui/material/CircularProgress';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CHAINS } from 'config';
import { RootState } from 'store';
import { setRedeemTx, setTransferComplete } from 'store/redeem';
import { displayAddress } from 'utils';
import { fetchRedeemTx } from 'utils/events';
import RouteOperator, { TransferDisplayData } from 'utils/routes';
import {
  TransferWallet,
  registerWalletSigner,
  switchNetwork,
} from 'utils/wallet';
import { PayloadType } from 'utils/sdk';

import AlertBanner from 'components/AlertBanner';
import Button from 'components/Button';
import InputContainer from 'components/InputContainer';
import { RenderRows } from 'components/RenderRows';
import Spacer from 'components/Spacer';
import WalletsModal from '../WalletModal';
import Header from './Header';

function SendTo() {
  const dispatch = useDispatch();
  const {
    redeemTx,
    transferComplete,
    route,
    signedMessage,
  } = useSelector((state: RootState) => state.redeem);
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const wallet = useSelector((state: RootState) => state.wallet.receiving);
  const [claimError, setClaimError] = useState('');

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

  const [inProgress, setInProgress] = useState(false);
  const [isConnected, setIsConnected] = useState(checkConnection());
  const [rows, setRows] = useState([] as TransferDisplayData);
  const [openWalletModal, setWalletModal] = useState(false);

  // get the redeem tx, for automatic transfers only
  const getRedeemTx = useCallback(async () => {
    if (redeemTx) return redeemTx;
    if (signedMessage) {
      const redeemed = await fetchRedeemTx(signedMessage);
      if (redeemed) {
        dispatch(setRedeemTx(redeemed.transactionHash));
        return redeemed.transactionHash;
      }
    }
  }, [redeemTx, signedMessage, dispatch]);

  useEffect(() => {
    if (!txData || !route) return;
    const populate = async () => {
      let receiveTx: string | undefined;
      try {
        receiveTx = await getRedeemTx();
      } catch (e) {
        console.error(`could not fetch redeem event:\n${e}`);
      }
      const rows = await RouteOperator.getTransferDestInfo(route, {
        txData,
        receiveTx,
        transferComplete,
      });
      setRows(rows);
    };
    populate();
  }, [transferComplete, getRedeemTx, txData, route]);

  useEffect(() => {
    setIsConnected(checkConnection());
  }, [wallet, checkConnection]);

  const claim = async () => {
    setInProgress(true);
    setClaimError('');
    if (!route) {
      throw new Error('Unknown route, cannot claim');
    }
    if (!wallet || !isConnected) {
      setClaimError('Connect to receiving wallet');
      throw new Error('Connect to receiving wallet');
    }
    const networkConfig = CHAINS[txData.toChain]!;
    if (!networkConfig) {
      setClaimError('Your claim has failed, please try again');
      throw new Error('invalid destination chain');
    }
    try {
      if (
        networkConfig!.context === Context.ETH &&
        typeof networkConfig.chainId === 'number'
      ) {
        registerWalletSigner(txData.toChain, TransferWallet.RECEIVING);
        await switchNetwork(networkConfig.chainId, TransferWallet.RECEIVING);
      }
      if (!signedMessage) {
        throw new Error('failed to get vaa, cannot redeem');
      }
      const txId = await RouteOperator.redeem(
        route,
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

  const loading =
    txData.payloadID === PayloadType.Manual
      ? inProgress && !transferComplete
      : !transferComplete;
  const manualClaimText =
    transferComplete || txData.payloadID === PayloadType.Automatic // todo: should be the other enum, should be named better than payload id
      ? ''
      : claimError
      ? 'Error please retry . . .'
      : 'Claim below';
  return (
    <div>
      <InputContainer>
        <Header
          network={txData.toChain}
          address={txData.recipient}
          loading={loading}
          txHash={redeemTx}
          text={manualClaimText}
        />
        <RenderRows rows={rows} />
      </InputContainer>

      {/* Claim button for manual transfers */}
      {txData.payloadID === PayloadType.Manual && !transferComplete && (
        <>
          <Spacer height={8} />
          <AlertBanner
            show={!!claimError}
            content={claimError}
            error
            margin="0 0 8px 0"
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
