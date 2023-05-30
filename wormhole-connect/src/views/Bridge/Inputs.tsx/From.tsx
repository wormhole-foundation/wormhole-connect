import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'ethers';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../../store';
import { TransferWallet, walletAcceptedNetworks } from '../../../utils/wallet';
import {
  setBalance as setStoreBalance,
  formatBalance,
  setToken,
  selectFromNetwork,
} from '../../../store/transfer';
import { CHAINS_ARR, TOKENS } from '../../../config';
import { getBalance, getNativeBalance } from '../../../sdk';

import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokensModal from '../../../components/TokensModal';
import NetworksModal from '../../../components/NetworksModal';

function FromInputs() {
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showNetworksModal, setShowNetworksModal] = useState(false);

  const wallet = useSelector((state: RootState) => state.wallet.sending);
  const {
    validate: showErrors,
    validations,
    fromNetwork,
    toNetwork,
    token,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transfer);
  const tokenConfig = token && TOKENS[token];

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

  // balance
  useEffect(() => {
    if (!fromNetwork || !tokenConfig || !wallet.address) {
      return setBalance(undefined);
    }
    if (tokenConfig.tokenId) {
      getBalance(wallet.address, tokenConfig.tokenId, fromNetwork).then(
        (res: BigNumber | null) => {
          const balance = formatBalance(fromNetwork, tokenConfig, res);
          setBalance(balance[tokenConfig.key]);
          dispatch(setStoreBalance(balance));
        },
      );
    } else {
      getNativeBalance(wallet.address, fromNetwork).then((res: BigNumber) => {
        const balance = formatBalance(fromNetwork, tokenConfig, res);
        setBalance(balance[tokenConfig.key]);
        dispatch(setStoreBalance(balance));
      });
    }
  }, [tokenConfig, fromNetwork, wallet.address, dispatch]);

  // token input jsx
  const selectedToken = tokenConfig
    ? { icon: tokenConfig.icon, text: tokenConfig.symbol }
    : undefined;
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={() => setShowTokensModal(true)}
      disabled={!fromNetwork || !wallet.address || isTransactionInProgress}
      editable
    />
  );

  return (
    <>
      <Inputs
        title="From"
        wallet={TransferWallet.SENDING}
        walletValidations={[validations.sendingWallet]}
        walletError={wallet.error}
        inputValidations={[
          validations.fromNetwork,
          validations.token,
          validations.amount,
        ]}
        network={fromNetwork}
        networkValidation={validations.fromNetwork}
        onNetworkClick={() => setShowNetworksModal(true)}
        tokenInput={tokenInput}
        amountInput={<AmountInput />}
        balance={balance}
      />
      <TokensModal
        open={showTokensModal}
        network={fromNetwork}
        walletAddress={wallet.address}
        onSelect={selectToken}
        onClose={() => setShowTokensModal(false)}
      />
      <NetworksModal
        open={showNetworksModal}
        title="Sending to"
        chains={CHAINS_ARR.filter((c) => c.key !== toNetwork)}
        onSelect={selectNetwork}
        onClose={() => setShowNetworksModal(false)}
        isDisabled={isDisabled}
      />
    </>
  );
}

export default FromInputs;
