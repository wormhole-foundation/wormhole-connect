import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { RootState } from 'store';
import {
  setToken,
  selectFromNetwork,
  setAmount,
  setReceiveAmount,
} from 'store/transferInput';
import { CHAINS, CHAINS_ARR, TOKENS } from 'config';
import { TransferWallet, walletAcceptedNetworks } from 'utils/wallet';
import RouteOperator from 'utils/routes/operator';

import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokensModal from 'components/TokensModal';
import NetworksModal from 'components/NetworksModal';

function FromInputs() {
  const dispatch = useDispatch();
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showNetworksModal, setShowNetworksModal] = useState(false);

  const { toNativeToken } = useSelector((state: RootState) => state.relay);
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
    return !walletAcceptedNetworks(wallet.type).includes(chain);
  };

  const selectNetwork = async (network: ChainName) => {
    selectFromNetwork(dispatch, network, wallet);
  };

  const selectToken = (token: string) => {
    dispatch(setToken(token));
  };

  // token input jsx
  const selectedToken = useMemo(() => {
    if (!tokenConfig) return undefined;
    const network = CHAINS[tokenConfig.nativeNetwork as ChainName]?.displayName;
    return {
      icon: tokenConfig.icon,
      text: tokenConfig.symbol,
      secondaryText: `(${network})`,
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

  // TODO: clean up the send/receive amount set logic
  const handleAmountChange = useCallback(
    async (value: number | string) => {
      if (typeof value === 'number') {
        dispatch(setAmount(`${value}`));
      } else {
        dispatch(setAmount(value));
      }
      const number =
        typeof value === 'number' ? value : Number.parseFloat(value);
      const receiveAmount = await RouteOperator.computeReceiveAmount(
        route,
        number,
        {
          toNativeToken,
        },
      );
      dispatch(setReceiveAmount(`${receiveAmount}`));
    },
    [route, toNativeToken, dispatch],
  );
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
        network={fromChain}
        networkValidation={validations.fromChain}
        onNetworkClick={() => setShowNetworksModal(true)}
        tokenInput={tokenInput}
        amountInput={amountInput}
        balance={balance}
      />
      <TokensModal
        open={showTokensModal}
        network={fromChain}
        walletAddress={wallet.address}
        type="source"
        onSelect={selectToken}
        onClose={() => setShowTokensModal(false)}
      />
      <NetworksModal
        open={showNetworksModal}
        title="Sending from"
        chains={CHAINS_ARR.filter((c) => c.key !== toChain)}
        onSelect={selectNetwork}
        onClose={() => setShowNetworksModal(false)}
        isDisabled={isDisabled}
      />
    </>
  );
}

export default FromInputs;
