import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BigNumber, utils } from 'ethers';
import CircularProgress from '@mui/material/CircularProgress';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../store';
import { setRedeemTx, setTransferComplete } from '../../store/redeem';
import {
  registerWalletSigner,
  switchNetwork,
  TransferWallet,
} from '../../utils/wallet';
import {
  accountExists,
  claimTransfer,
  parseAddress,
  PaymentOption,
  solanaContext,
} from '../../sdk';
import { displayAddress } from '../../utils';
import { CHAINS } from '../../config';

import Header from './Header';
import AlertBanner from '../../components/AlertBanner';
// import Confirmations from './Confirmations';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import WalletsModal from '../WalletModal';
import { WalletData } from '../../store/wallet';

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

type Props = {
  txData: any;
  vaa: any;
  wallet: WalletData;
  setClaimError: any;
};
function SendToSolana(props: Props) {
  const dispatch = useDispatch();
  const [inProgress, setInProgress] = useState(false);
  const [associatedTokenAccount, setAssociatedTokenAccount] = useState(false);
  const txData = useSelector((state: RootState) => state.redeem.txData)!;

  useEffect(() => {
    const checkAccount = async () => {
      const hasAccount = await accountExists(txData.recipient);
      setAssociatedTokenAccount(hasAccount);
    };
    checkAccount();
  }, [txData]);

  const createTokenAccount = async () => {
    setInProgress(true);
    const tokenId = {
      chain: txData.tokenChain,
      address: txData.tokenAddress,
    };
    await solanaContext().createAssociatedTokenAccount(
      tokenId,
      props.wallet.address,
    );
    setInProgress(false);
    setAssociatedTokenAccount(true);
  };

  const claim = async () => {
    setInProgress(true);
    props.setClaimError('');
    const networkConfig = CHAINS[props.txData.toChain]!;
    if (!networkConfig) {
      props.setClaimError('Your claim has failed, please try again');
      throw new Error('invalid destination chain');
    }
    try {
      const receipt = await claimTransfer(
        props.txData.toChain,
        utils.arrayify(props.vaa.bytes),
        props.wallet.address,
      );
      dispatch(setRedeemTx(receipt.transactionHash));
      dispatch(setTransferComplete(true));
      setInProgress(false);
      props.setClaimError('');
    } catch (e) {
      setInProgress(false);
      props.setClaimError('Your claim has failed, please try again');
      console.error(e);
    }
  };

  return !!associatedTokenAccount ? (
    <Button onClick={claim} action disabled={inProgress}>
      {inProgress ? <CircularProgress size={22} /> : 'Claim'}
    </Button>
  ) : (
    <Button onClick={createTokenAccount} action disabled={inProgress}>
      Create token account
    </Button>
  );
}

function SendTo() {
  const dispatch = useDispatch();
  const { vaa, redeemTx, transferComplete } = useSelector(
    (state: RootState) => state.redeem,
  );
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const wallet = useSelector((state: RootState) => state.wallet.receiving);
  const [claimError, setClaimError] = useState('');

  const connect = () => {
    setWalletModal(true);
  };

  const checkConnection = () => {
    if (!txData) return;
    const addr = wallet.address.toLowerCase();
    const curAddr = wallet.currentAddress.toLowerCase();
    const formattedRecipient = parseAddress(txData.toChain, txData.recipient);
    const reqAddr = formattedRecipient.toLowerCase();
    return addr === curAddr && addr === reqAddr;
  };

  const [inProgress, setInProgress] = useState(false);
  const [isConnected, setIsConnected] = useState(checkConnection());
  const [rows, setRows] = useState([] as RowsData);
  const [openWalletModal, setWalletModal] = useState(false);

  useEffect(() => {
    if (!txData) return;
    const rows = getRows(txData);
    setRows(rows);
  }, []);

  const claim = async () => {
    setInProgress(true);
    setClaimError('');
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
      if (networkConfig!.context === Context.ETH) {
        registerWalletSigner(txData.toChain, TransferWallet.RECEIVING);
        await switchNetwork(networkConfig.chainId, TransferWallet.RECEIVING);
      }
      const receipt = await claimTransfer(
        txData.toChain,
        utils.arrayify(vaa.bytes),
        wallet.address,
      );
      dispatch(setRedeemTx(receipt.transactionHash));
      dispatch(setTransferComplete(true));
      setInProgress(false);
      setClaimError('');
    } catch (e) {
      setInProgress(false);
      setClaimError('Your claim has failed, please try again');
      console.error(e);
    }
  };

  useEffect(() => {
    setIsConnected(checkConnection());
  }, [wallet]);

  return (
    <div>
      <InputContainer>
        <Header
          network={txData.toChain}
          address={txData.recipient}
          loading={inProgress && !transferComplete}
          txHash={redeemTx}
          error={claimError ? 'Error please retry . . .' : ''}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {txData.payloadID === PaymentOption.MANUAL && !transferComplete && (
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
              txData.toChain === 'solana' ? (
                <SendToSolana
                  txData={txData}
                  vaa={vaa}
                  wallet={wallet}
                  setClaimError={setClaimError}
                />
              ) : (
                <Button onClick={claim} action disabled={inProgress}>
                  {inProgress ? <CircularProgress size={22} /> : 'Claim'}
                </Button>
              )
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
