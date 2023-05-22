import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BigNumber, utils } from 'ethers';
import CircularProgress from '@mui/material/CircularProgress';
import {
  ChainName,
  Context,
  WormholeContext,
  SuiContext,
  AptosContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../store';
import { setRedeemTx, setTransferComplete } from '../../store/redeem';
import {
  MAX_DECIMALS,
  displayAddress,
  fromNormalizedDecimals,
  getTokenDecimals,
  getWrappedTokenId,
  toNormalizedDecimals,
} from '../../utils';
import {
  registerWalletSigner,
  switchNetwork,
  TransferWallet,
} from '../../utils/wallet';
import { toDecimals } from '../../utils/balance';
import {
  wh,
  claimTransfer,
  estimateClaimGasFee,
  PaymentOption,
  calculateNativeTokenAmt,
  toChainId,
} from '../../sdk';
import { CHAINS, TOKENS } from '../../config';
import WalletsModal from '../WalletModal';
import { GAS_ESTIMATES } from '../../config';
import { fetchRedeemTx, fetchSwapEvent } from '../../utils/events';

import Header from './Header';
import AlertBanner from '../../components/AlertBanner';
// import Confirmations from './Confirmations';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import { Types } from 'aptos';
import { getTotalGasUsed } from '@mysten/sui.js';

const calculateGas = async (chain: ChainName, receiveTx?: string) => {
  const { gasToken } = CHAINS[chain]!;
  const token = TOKENS[gasToken];
  const decimals = getTokenDecimals(
    toChainId(chain),
    token.tokenId
  );

  if (chain === 'solana') {
    return toDecimals(
      BigNumber.from(GAS_ESTIMATES.solana!.claim),
      decimals,
      MAX_DECIMALS,
    );
  }
  if (receiveTx) {
    if (chain === 'aptos') {
      const aptosClient = (
        wh.getContext('aptos') as AptosContext<WormholeContext>
      ).aptosClient;
      const txn = await aptosClient.getTransactionByHash(receiveTx);
      if (txn.type === 'user_transaction') {
        const userTxn = txn as Types.UserTransaction;
        const gasFee = BigNumber.from(userTxn.gas_used).mul(
          userTxn.gas_unit_price,
        );
        return toDecimals(gasFee || 0, decimals, MAX_DECIMALS);
      }
    } else if (chain === 'sui') {
      const provider = (wh.getContext('sui') as SuiContext<WormholeContext>)
        .provider;
      const txBlock = await provider.getTransactionBlock({
        digest: receiveTx,
        options: { showEvents: true, showEffects: true, showInput: true },
      });
      const gasFee = BigNumber.from(getTotalGasUsed(txBlock) || 0);
      return toDecimals(gasFee, decimals, MAX_DECIMALS);
    } else {
      const provider = wh.mustGetProvider(chain);
      const receipt = await provider.getTransactionReceipt(receiveTx);
      const { gasUsed, effectiveGasPrice } = receipt;
      if (!gasUsed || !effectiveGasPrice) return;
      const gasFee = gasUsed.mul(effectiveGasPrice);
      return toDecimals(gasFee, decimals, MAX_DECIMALS);
    }
  }
  return await estimateClaimGasFee(chain);
};

const getManualRows = async (
  txData: any,
  receiveTx?: string,
): Promise<RowsData> => {
  const token = TOKENS[txData.tokenKey];
  const { gasToken } = CHAINS[txData.toChain]!;

  // get gas used (if complete) or gas estimate if not
  const gas = await calculateGas(txData.toChain, receiveTx);

  const formattedAmt = toNormalizedDecimals(
    txData.amount,
    txData.tokenDecimals,
    MAX_DECIMALS,
  );
  return [
    {
      title: 'Amount',
      value: `${formattedAmt} ${token.symbol}`,
    },
    {
      title: receiveTx ? 'Gas fee' : 'Gas estimate',
      value: gas ? `${gas} ${gasToken}` : '—',
    },
  ];
};

const getAutomaticRows = async (
  txData: any,
  receiveTx?: string,
  transferComplete?: boolean,
): Promise<RowsData> => {
  const token = TOKENS[txData.tokenKey];
  const { gasToken } = CHAINS[txData.toChain]!;

  // calculate the amount of native gas received
  let nativeGasAmt: string | undefined;
  const nativeGasToken = TOKENS[gasToken];
  if (receiveTx) {
    let nativeSwapAmount: any;
    try {
      nativeSwapAmount = await fetchSwapEvent(txData);
    } catch (e) {
      console.error(`could not fetch swap event:\n${e}`);
    }
    if (nativeSwapAmount) {
      const decimals = getTokenDecimals(
        wh.toChainId(txData.toChain),
        nativeGasToken.tokenId,
      );
      nativeGasAmt = toDecimals(
        nativeSwapAmount,
        decimals,
        MAX_DECIMALS,
      );
    }
  } else if (!transferComplete) {
    // get the decimals on the target chain
    const destinationTokenDecimals = getTokenDecimals(
      wh.toChainId(txData.toChain),
      txData.tokenId,
    );
    const amount = await calculateNativeTokenAmt(
      txData.toChain,
      txData.tokenId,
      fromNormalizedDecimals(
        txData.toNativeTokenAmount,
        destinationTokenDecimals,
      ),
      txData.recipient,
    );
    // get the decimals on the target chain
    const nativeGasTokenDecimals = getTokenDecimals(
      wh.toChainId(txData.toChain),
      getWrappedTokenId(nativeGasToken),
    );
    nativeGasAmt = toDecimals(
      amount.toString(),
      // nativeGasToken.decimals,
      nativeGasTokenDecimals,
      MAX_DECIMALS,
    );
  }

  const receiveAmt = BigNumber.from(txData.amount)
    .sub(BigNumber.from(txData.relayerFee))
    .sub(BigNumber.from(txData.toNativeTokenAmount || 0));
  const formattedAmt = toNormalizedDecimals(
    receiveAmt,
    txData.tokenDecimals,
    MAX_DECIMALS,
  );

  return [
    {
      title: 'Amount',
      value: `${formattedAmt} ${token.symbol}`,
    },
    {
      title: 'Native gas token',
      value: nativeGasAmt ? `${nativeGasAmt} ${gasToken}` : '—',
    },
  ];
};

const getRows = async (
  txData: any,
  receiveTx?: string,
  transferComplete?: boolean,
): Promise<RowsData> => {
  if (txData.payloadID === PaymentOption.MANUAL) {
    return await getManualRows(txData, receiveTx);
  }
  return await getAutomaticRows(txData, receiveTx, transferComplete);
};

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

  const checkConnection = useCallback(() => {
    if (!txData) return;
    const addr = wallet.address.toLowerCase();
    const curAddr = wallet.currentAddress.toLowerCase();
    const reqAddr = txData.recipient.toLowerCase();
    return addr === curAddr && addr === reqAddr;
  }, [wallet, txData]);

  const [inProgress, setInProgress] = useState(false);
  const [isConnected, setIsConnected] = useState(checkConnection());
  const [rows, setRows] = useState([] as RowsData);
  const [openWalletModal, setWalletModal] = useState(false);

  // get the redeem tx, for automatic transfers only
  const getRedeemTx = useCallback(async () => {
    if (redeemTx) return redeemTx;
    if (vaa) {
      const redeemed = await fetchRedeemTx(txData);
      if (redeemed) {
        dispatch(setRedeemTx(redeemed.transactionHash));
        return redeemed.transactionHash;
      }
    }
  }, [redeemTx, vaa, txData, dispatch]);

  useEffect(() => {
    if (!txData) return;
    const populate = async () => {
      let tx: string | undefined;
      try {
        tx = await getRedeemTx();
      } catch (e) {
        console.error(`could not fetch redeem event:\n${e}`);
      }
      const rows = await getRows(txData, tx, transferComplete);
      setRows(rows);
    };
    populate();
  }, [transferComplete, getRedeemTx, txData]);

  useEffect(() => {
    setIsConnected(checkConnection());
  }, [wallet, checkConnection]);

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
      const txId = await claimTransfer(
        txData.toChain,
        utils.arrayify(vaa.bytes),
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
    txData.payloadID === PaymentOption.MANUAL
      ? inProgress && !transferComplete
      : !transferComplete;
  const manualClaimText =
    transferComplete || txData.payloadID === PaymentOption.AUTOMATIC
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
