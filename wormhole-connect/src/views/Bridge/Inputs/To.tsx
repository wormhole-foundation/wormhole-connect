import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'ethers';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../../store';
import { TransferWallet, walletAcceptedNetworks } from '../../../utils/wallet';
import { getWrappedToken } from '../../../utils';
import { CHAINS_ARR, TOKENS } from '../../../config';
import { wh } from '../../../utils/sdk';
import {
  formatBalance,
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

function ToInputs() {
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showNetworksModal, setShowNetworksModal] = useState(false);

  const {
    validate: showErrors,
    validations,
    fromNetwork,
    toNetwork,
    destToken,
    receiveAmount,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);
  const { receiving } = useSelector((state: RootState) => state.wallet);

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

  // get balance on destination chain
  useEffect(() => {
    if (!fromNetwork || !toNetwork || !tokenConfig || !receiving.address) {
      return setBalance(undefined);
    }
    const { tokenId } = tokenConfig.tokenId
      ? tokenConfig
      : TOKENS[tokenConfig.wrappedAsset!];
    wh.getTokenBalance(receiving.address, tokenId!, toNetwork).then(
      (res: BigNumber | null) => {
        const balance = formatBalance(toNetwork, tokenConfig, res);
        setBalance(balance[tokenConfig.key]);
      },
    );
  }, [tokenConfig, fromNetwork, toNetwork, receiving.address]);

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

  const handleAmountChange = (amount: string) => {
    dispatch(setAmount(amount));
    dispatch(setReceiveAmount(amount));
  };
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
