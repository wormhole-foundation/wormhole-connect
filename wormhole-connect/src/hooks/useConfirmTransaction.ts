import { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Context } from 'sdklegacy';

import config from 'config';
import { RouteContext } from 'contexts/RouteContext';
import { useUSDamountGetter } from 'hooks/useUSDamountGetter';
import { useGetTokens } from 'hooks/useGetTokens';
import {
  setTxDetails,
  setSendTx,
  setRoute as setRedeemRoute,
  setTimestamp,
} from 'store/redeem';
import { setRoute as setAppRoute } from 'store/router';
import { setAmount, setIsTransactionInProgress } from 'store/transferInput';
import { getTransferDetails } from 'telemetry';
import { ERR_USER_REJECTED } from 'telemetry/types';
import { toDecimals } from 'utils/balance';
import { interpretTransferError } from 'utils/errors';
import { addTxToLocalStorage } from 'utils/inProgressTxCache';
import { validate, isTransferValid } from 'utils/transferValidation';
import {
  registerWalletSigner,
  switchChain,
  TransferWallet,
} from 'utils/wallet';

import type { RootState } from 'store';
import type { RelayerFee } from 'store/relay';
import type { QuoteResult } from 'routes/operator';

type Props = {
  quotes: Record<string, QuoteResult | undefined>;
};

type ReturnProps = {
  error: string | undefined;
  // errorInternal can be a result of custom validation, hence of any type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorInternal: any | undefined;
  onConfirm: () => void;
};

const useConfirmTransaction = (props: Props): ReturnProps => {
  const dispatch = useDispatch();

  const [error, setError] = useState<string | undefined>(undefined);
  // errorInternal can be a result of custom validation, hence of any type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorInternal, setErrorInternal] = useState<any | undefined>(
    undefined,
  );

  const routeContext = useContext(RouteContext);

  const transferInput = useSelector((state: RootState) => state.transferInput);

  const {
    amount,
    fromChain: sourceChain,
    toChain: destChain,
    route,
    validations,
  } = transferInput;

  const { sourceToken, destToken } = useGetTokens();

  const wallet = useSelector((state: RootState) => state.wallet);
  const { sending: sendingWallet, receiving: receivingWallet } = wallet;

  const relay = useSelector((state: RootState) => state.relay);
  const { toNativeToken } = relay;

  const quoteResult = props.quotes[route ?? ''];
  const quote = quoteResult?.success ? quoteResult : undefined;
  const receiveNativeAmount = quote?.destinationNativeGas;

  const getUSDAmount = useUSDamountGetter();

  const onConfirm = async () => {
    // Clear previous errors
    if (error) {
      setError(undefined);
    }

    if (config.ui.previewMode) {
      setError('Connect is in preview mode');
      return;
    }

    // Pre-check of required values
    if (
      !sourceChain ||
      !sourceToken ||
      !destChain ||
      !destToken ||
      !amount ||
      !route ||
      !quote
    ) {
      return;
    }

    // Validate all inputs
    // The results of this check will be written back to Redux store (see transferInput.validations).
    await validate({ transferInput, relay, wallet }, dispatch, () => false);

    const valid = isTransferValid(validations);

    if (!valid || !route) {
      return;
    }

    const transferDetails = getTransferDetails(
      route,
      sourceToken,
      destToken,
      sourceChain,
      destChain,
      amount,
      getUSDAmount,
    );

    // Handle custom transfer validation (if provided by integrator)
    if (config.validateTransfer) {
      try {
        const { isValid, error } = await config.validateTransfer({
          ...transferDetails,
          fromWalletAddress: sendingWallet.address,
          toWalletAddress: receivingWallet.address,
        });
        if (!isValid) {
          setError(error ?? 'Transfer validation failed');
          return;
        }
      } catch (e: unknown) {
        setError('Error validating transfer');
        setErrorInternal(e);
        console.error(e);
        return;
      }
    }

    dispatch(setIsTransactionInProgress(true));

    try {
      const fromConfig = config.chains[sourceChain];

      if (fromConfig?.context === Context.ETH) {
        const chainId = fromConfig.chainId;

        if (typeof chainId !== 'number') {
          throw new Error('Invalid EVM chain ID');
        }

        await switchChain(chainId, TransferWallet.SENDING);
        await registerWalletSigner(sourceChain, TransferWallet.SENDING);
      }

      config.triggerEvent({
        type: 'transfer.initiate',
        details: transferDetails,
      });

      const [sdkRoute, receipt] = await config.routes
        .get(route)
        .send(
          sourceToken,
          amount,
          sourceChain,
          sendingWallet.address,
          destChain,
          receivingWallet.address,
          destToken,
          { nativeGas: toNativeToken },
        );

      const txId =
        'originTxs' in receipt
          ? receipt.originTxs[receipt.originTxs.length - 1].txid
          : undefined;

      config.triggerEvent({
        type: 'transfer.start',
        details: { ...transferDetails, txId },
      });

      if (!txId) throw new Error("Can't find txid in receipt");

      let relayerFee: RelayerFee | undefined = undefined;
      if (quote.relayFee) {
        const { token, amount } = quote.relayFee;
        const feeToken = config.tokens.get(token);

        const formattedFee = Number.parseFloat(
          toDecimals(amount.amount, amount.decimals, 6),
        );

        relayerFee = {
          fee: formattedFee,
          token: feeToken?.tuple,
        };
      }

      const txTimestamp = Date.now();
      const txDetails = {
        sendTx: txId,
        sender: sendingWallet.address,
        amount,
        recipient: receivingWallet.address,
        toChain: receipt.to,
        fromChain: receipt.from,
        receivedToken: destToken.tuple,
        token: sourceToken.tuple,
        tokenAddress: sourceToken.tuple[1],
        tokenKey: sourceToken.key,
        tokenDecimals: sourceToken.decimals,
        relayerFee,
        receiveAmount: quote.destinationToken.amount,
        receiveNativeAmount,
        eta: quote.eta || 0,
      };

      // Add the new transaction to local storage
      addTxToLocalStorage({
        txDetails,
        txHash: txId,
        timestamp: txTimestamp,
        receipt,
        route,
      });

      // Set the start time of the transaction
      dispatch(setTimestamp(txTimestamp));

      // TODO: SDKV2 set the tx details using on-chain data
      // because they might be different than what we have in memory (relayer fee)
      // or we may not have all the data (e.g. block)
      // TODO: we don't need all of these details
      // The SDK should provide a way to get the details from the chain (e.g. route.lookupSourceTxDetails)
      dispatch(setTxDetails(txDetails));

      // Reset the amount for a successful transaction
      dispatch(setAmount(''));

      routeContext.setRoute(sdkRoute);
      routeContext.setReceipt(receipt);

      dispatch(setSendTx(txId));
      dispatch(setRedeemRoute(route));
      dispatch(setAppRoute('redeem'));
      setError(undefined);
    } catch (e: unknown) {
      const [uiError, transferError] = interpretTransferError(
        e,
        transferDetails,
      );

      if (transferError.type === ERR_USER_REJECTED) {
        // User intentionally rejected in their wallet. This is not an error in the sense
        // that something went wrong.
      } else {
        console.error('Wormhole Connect: error completing transfer', e);

        // Show error in UI
        setError(uiError);
        setErrorInternal(e);

        // Trigger transfer error event to integrator
        config.triggerEvent({
          type: 'transfer.error',
          error: transferError,
          details: transferDetails,
        });
      }
    } finally {
      dispatch(setIsTransactionInProgress(false));
    }
  };

  return {
    onConfirm,
    error,
    errorInternal,
  };
};

export default useConfirmTransaction;
