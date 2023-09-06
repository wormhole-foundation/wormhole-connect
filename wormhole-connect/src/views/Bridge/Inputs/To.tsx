import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { RootState } from 'store';
import {
  selectToChain,
  setAmount,
  setDestToken,
  setReceiveAmount,
} from 'store/transferInput';
import { TransferWallet, walletAcceptedChains } from 'utils/wallet';
import { getWrappedToken } from 'utils';
import RouteOperator from 'utils/routes/operator';
import { CHAINS, CHAINS_ARR, TOKENS } from 'config';

import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokenWarnings from './TokenWarnings';
import TokensModal from 'components/TokensModal';
import ChainsModal from 'components/ChainsModal';

function ToInputs() {
  const dispatch = useDispatch();
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showChainsModal, setShowChainsModal] = useState(false);

  const {
    validate: showErrors,
    validations,
    route,
    fromChain,
    toChain,
    destBalances,
    destToken,
    receiveAmount,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);
  const { toNativeToken } = useSelector((state: RootState) => state.relay);
  const { receiving } = useSelector((state: RootState) => state.wallet);
  const balance = destBalances[destToken] || undefined;

  const tokenConfig = TOKENS[destToken];

  const selectToken = (token: string) => {
    dispatch(setDestToken(token));
  };

  const isDisabled = (chain: ChainName) => {
    // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
    return !walletAcceptedChains(receiving.type).includes(chain);
  };

  const selectChain = async (chain: ChainName) => {
    selectToChain(dispatch, chain, receiving);
  };

  // token display jsx
  const selectedToken = useMemo(() => {
    if (!tokenConfig) return undefined;
    const symbol = getWrappedToken(tokenConfig).symbol;
    const chain = CHAINS[tokenConfig.nativeChain]?.displayName;
    return {
      icon: tokenConfig.icon,
      text: symbol,
      secondaryText: `(${chain})`,
    };
  }, [tokenConfig]);
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={() => setShowTokensModal(true)}
      disabled={!toChain || !receiving.address || isTransactionInProgress}
      editable
    />
  );

  const handleAmountChange = useCallback(
    async (value: number | string) => {
      if (typeof value === 'number') {
        dispatch(setReceiveAmount(`${value}`));
      } else {
        dispatch(setReceiveAmount(value));
      }
      const number =
        typeof value === 'number' ? value : Number.parseFloat(value);
      dispatch(setReceiveAmount(`${number}`));
      const sendAmount = await RouteOperator.computeSendAmount(route, number, {
        toNativeToken,
      });
      dispatch(setAmount(`${sendAmount}`));
    },
    [route, toNativeToken, dispatch],
  );
  const amountInput = (
    <AmountInput
      handleAmountChange={handleAmountChange}
      value={receiveAmount}
    />
  );

  return (
    <>
      <Inputs
        title="To"
        wallet={TransferWallet.RECEIVING}
        walletValidations={[validations.receivingWallet]}
        walletError={receiving.error}
        inputValidations={[validations.toChain, validations.destToken]}
        chain={toChain}
        chainValidation={validations.toChain}
        onChainClick={() => setShowChainsModal(true)}
        tokenInput={tokenInput}
        amountInput={amountInput}
        balance={balance}
        warning={<TokenWarnings />}
      />
      <TokensModal
        open={showTokensModal}
        chain={toChain}
        walletAddress={receiving.address}
        type="dest"
        onSelect={selectToken}
        onClose={() => setShowTokensModal(false)}
      />
      <ChainsModal
        open={showChainsModal}
        title="Sending to"
        chains={CHAINS_ARR.filter((c) => c.key !== fromChain)}
        onSelect={selectChain}
        onClose={() => setShowChainsModal(false)}
        isDisabled={isDisabled}
      />
    </>
  );
}

export default ToInputs;
