import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { BigNumber, utils } from 'ethers';
import CircularProgress from '@mui/material/CircularProgress';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { setRedeemTx, setTransferComplete } from '../../store/redeem';
import {
  registerWalletSigner,
  switchNetwork,
  TransferWallet,
} from '../../utils/wallet';
import { ParsedVaa } from '../../utils/vaa';
import { claimTransfer } from '../../sdk/sdk';
import { displayAddress } from '../../utils';
import { CHAINS } from '../../sdk/config';

import Header from './Header';
// import Confirmations from './Confirmations';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import WalletsModal from '../WalletModal';

const getRows = (txData: any): RowsData => {
  const decimals = txData.tokenDecimals > 8 ? 8 : txData.tokenDecimals;
  const type = txData.payloadID;
  const { gasToken } = CHAINS[txData.toChain]!;

  // manual transfers
  if (type === PaymentOption.MANUAL) {
    const formattedAmt = utils.formatUnits(txData.amount, decimals);
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${txData.tokenSymbol}`,
      },
      {
        title: 'Gas estimate',
        value: `TODO ${gasToken}`,
      },
    ];
  }

  // automatic transfers
  const receiveAmt = BigNumber.from(txData.amount).sub(
    BigNumber.from(txData.relayerFee),
  );
  const formattedAmt = utils.formatUnits(receiveAmt, decimals);
  const formattedToNative = utils.formatUnits(
    txData.toNativeTokenAmount,
    decimals,
  );
  return [
    {
      title: 'Amount',
      value: `${formattedAmt} ${txData.tokenSymbol}`,
    },
    {
      title: 'Native gas token',
      value: `${formattedToNative} ${gasToken}`,
    },
  ];
};

function SendTo() {
  const dispatch = useDispatch();
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const toAddr = useSelector(
    (state: RootState) => state.wallet.receiving.address,
  );
  const receiving = useSelector((state: RootState) => state.wallet.receiving);
  const redeemTx = useSelector((state: RootState) => state.redeem.redeemTx);
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const [inProgress, setInProgress] = useState(false);
  const [isConnected, setIsConnected] = useState(
    receiving.currentAddress.toLowerCase() === receiving.address.toLowerCase(),
  );
  const [rows, setRows] = useState([] as RowsData);
  const [openWalletModal, setWalletModal] = useState(false);

  useEffect(() => {
    if (!txData) return;
    const rows = getRows(txData);
    setRows(rows);
  }, []);

  // const pending = vaa.guardianSignatures < REQUIRED_CONFIRMATIONS;
  const claim = async () => {
    setInProgress(true);
    const networkConfig = CHAINS[txData.toChain]!;
    if (!networkConfig) throw new Error('invalid destination chain');
    try {
      if (networkConfig?.context === Context.ETH) {
        registerWalletSigner(txData.toChain, TransferWallet.RECEIVING);
        await switchNetwork(networkConfig.chainId, TransferWallet.RECEIVING);
      }
      const receipt = await claimTransfer(
        txData.toChain,
        utils.arrayify(vaa.bytes),
      );
      dispatch(setRedeemTx(receipt.transactionHash));
      dispatch(setTransferComplete(true));
      setInProgress(false);
    } catch (e) {
      setInProgress(false);
      console.error(e);
    }
  };
  const connect = async () => {
    setWalletModal(true);
  };

  useEffect(() => {
    setIsConnected(
      receiving.currentAddress.toLowerCase() ===
        receiving.address.toLowerCase(),
    );
  }, [receiving]);

  return (
    <div>
      <InputContainer>
        <Header
          network={txData.toChain}
          address={txData.recipient}
          loading={
            !transferComplete &&
            txData.payloadID === PaymentOption.MANUAL &&
            !redeemTx
          }
          txHash={redeemTx}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {txData.payloadID === PaymentOption.MANUAL && !transferComplete && (
        <>
          <Spacer height={8} />
          {toAddr ? (
            isConnected ? (
              <Button onClick={claim} action disabled={inProgress}>
                {inProgress ? <CircularProgress size={18} /> : 'Claim'}
              </Button>
            ) : (
              <Button disabled elevated>
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
