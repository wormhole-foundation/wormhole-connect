import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { RootState } from 'store';
import {
  setToken,
  selectFromChain,
  setAmount,
  setReceiveAmount,
} from 'store/transferInput';
import { CHAINS, CHAINS_ARR, TOKENS } from 'config';
import { TransferWallet, walletAcceptedChains } from 'utils/wallet';
import RouteOperator from 'utils/routes/operator';

import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokensModal from 'components/TokensModal';
import ChainsModal from 'components/ChainsModal';

function FromInputs() {
  const dispatch = useDispatch();
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showChainsModal, setShowChainsModal] = useState(false);

  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const wallet = useSelector((state: RootState) => state.wallet.sending);
  const {
    validate: showErrors,
    validations,
    route,
    fromChain,
    toChain,
    sourceBalances: balances,
    token,
    amount,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);
  const tokenConfig = token && TOKENS[token];
  const balance = balances[token] || undefined;

  const isDisabled = (chain: ChainName) => {
    // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
    return !walletAcceptedChains(wallet.type).includes(chain);
  };

  const selectChain = async (chain: ChainName) => {
    selectFromChain(dispatch, chain, wallet);
  };

  const selectToken = (token: string) => {
    dispatch(setToken(token));
  };

  // token input jsx
  const selectedToken = useMemo(() => {
    if (!tokenConfig) return undefined;
    const chain = CHAINS[tokenConfig.nativeChain as ChainName]?.displayName;
    return {
      icon: tokenConfig.icon,
      text: tokenConfig.symbol,
      secondaryText: `(${chain})`,
    };
  }, [tokenConfig]);
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={() => setShowTokensModal(true)}
      disabled={!fromChain || !wallet.address || isTransactionInProgress}
      editable
    />
  );

  const computeReceiveAmount = async (value: number | string) => {
    if (typeof value === 'number') {
      dispatch(setAmount(`${value}`));
    } else {
      dispatch(setAmount(value));
    }
    const number = typeof value === 'number' ? value : Number.parseFloat(value);
    if (!route) {
      dispatch(setReceiveAmount(`${value}`));
      return;
    }
    const receiveAmount = await RouteOperator.computeReceiveAmount(
      route,
      number,
      {
        toNativeToken,
        relayerFee,
      },
    );
    dispatch(setReceiveAmount(`${receiveAmount}`));
  };

  // TODO: clean up the send/receive amount set logic
  const handleAmountChange = useCallback(computeReceiveAmount, [
    route,
    toNativeToken,
    relayerFee,
    dispatch,
  ]);
  // if route changes, re-calculate the amount
  useEffect(() => {
    if (!route) return;
    computeReceiveAmount(amount);
  }, [route, amount]);
  const amountInput = (
    <AmountInput handleAmountChange={handleAmountChange} value={amount} />
  );

  return (
    <>
      <Inputs
        title="From"
        wallet={TransferWallet.SENDING}
        walletValidations={[validations.sendingWallet]}
        walletError={wallet.error}
        inputValidations={[
          validations.fromChain,
          validations.token,
          validations.amount,
        ]}
        chain={fromChain}
        chainValidation={validations.fromChain}
        onChainClick={() => setShowChainsModal(true)}
        tokenInput={tokenInput}
        amountInput={amountInput}
        balance={balance}
      />
      <TokensModal
        open={showTokensModal}
        chain={fromChain}
        walletAddress={wallet.address}
        type="source"
        onSelect={selectToken}
        onClose={() => setShowTokensModal(false)}
      />
      <ChainsModal
        open={showChainsModal}
        title="Sending from"
        chains={CHAINS_ARR.filter((c) => c.key !== toChain)}
        onSelect={selectChain}
        onClose={() => setShowChainsModal(false)}
        isDisabled={isDisabled}
      />
    </>
  );
}

export default FromInputs;
