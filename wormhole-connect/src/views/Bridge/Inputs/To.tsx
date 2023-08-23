import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../../store';
import { TransferWallet, walletAcceptedNetworks } from '../../../utils/wallet';
import { getWrappedToken } from '../../../utils';
import { CHAINS_ARR, TOKENS } from '../../../config';
import {
  selectToNetwork,
  setAmount,
  setDestToken,
  setReceiveAmount,
} from '../../../store/transferInput';

import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokenWarnings from './TokenWarnings';
import TokensModal from '../../../components/TokensModal';
import NetworksModal from '../../../components/NetworksModal';
import Operator from '../../../utils/routes';

function ToInputs() {
  const dispatch = useDispatch();
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showNetworksModal, setShowNetworksModal] = useState(false);

  const {
    validate: showErrors,
    validations,
    route,
    fromNetwork,
    toNetwork,
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
    return !walletAcceptedNetworks(receiving.type).includes(chain);
  };

  const selectNetwork = async (network: ChainName) => {
    selectToNetwork(dispatch, network, receiving);
  };

  // token display jsx
  const symbol = tokenConfig && getWrappedToken(tokenConfig).symbol;
  const selectedToken = tokenConfig
    ? { icon: tokenConfig.icon, text: symbol }
    : undefined;
  // TODO: add validation for destination token
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={() => setShowTokensModal(true)}
      disabled={!toNetwork || !receiving.address || isTransactionInProgress}
      editable
    />
  );

  const handleAmountChange = useCallback(
    async (amount: string) => {
      dispatch(setReceiveAmount(amount));
      const r = new Operator();
      const sendAmount = await r.computeSendAmount(
        route,
        Number.parseFloat(amount),
        { toNativeToken },
      );
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
        inputValidations={[validations.toNetwork, validations.destToken]}
        network={toNetwork}
        networkValidation={validations.toNetwork}
        onNetworkClick={() => setShowNetworksModal(true)}
        tokenInput={tokenInput}
        amountInput={amountInput}
        balance={balance}
        warning={<TokenWarnings />}
      />
      <TokensModal
        open={showTokensModal}
        network={toNetwork}
        walletAddress={receiving.address}
        type="dest"
        onSelect={selectToken}
        onClose={() => setShowTokensModal(false)}
      />
      <NetworksModal
        open={showNetworksModal}
        title="Sending to"
        chains={CHAINS_ARR.filter((c) => c.key !== fromNetwork)}
        onSelect={selectNetwork}
        onClose={() => setShowNetworksModal(false)}
        isDisabled={isDisabled}
      />
    </>
  );
}

export default ToInputs;
