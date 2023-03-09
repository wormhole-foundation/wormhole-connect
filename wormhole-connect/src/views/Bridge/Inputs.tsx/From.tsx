import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'ethers';
import { RootState } from '../../../store';
import { setFromNetworksModal, setTokensModal } from '../../../store/router';
import { TransferWallet } from '../../../utils/wallet';
import { setAmount } from '../../../store/transfer';
import {
  setBalance as setStoreBalance,
  formatBalance,
} from '../../../store/transfer';
import { CHAINS, TOKENS } from '../../../sdk/config';
import { getBalance, getNativeBalance } from '../../../sdk/sdk';
import { validate } from '../../../utils/transferValidation';

import NetworkTile from '../NetworkTile';
import InputTransparent from '../../../components/InputTransparent';
import ConnectWallet from '../../../components/ConnectWallet';
import ValidationError from '../ValidationError';
import Inputs from './Layout';
import Input from './Input';
import Select from './Select';

function FromInputs() {
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);

  const fromNetwork = useSelector(
    (state: RootState) => state.transfer.fromNetwork,
  );
  const walletAddr = useSelector(
    (state: RootState) => state.wallet.sending.address,
  );
  const {
    validate: showErrors,
    validations,
    token,
  } = useSelector((state: RootState) => state.transfer);
  const tokenConfig = token && TOKENS[token];
  const fromNetworkConfig = fromNetwork ? CHAINS[fromNetwork] : undefined;

  // set store values
  const openFromNetworksModal = () => dispatch(setFromNetworksModal(true));
  const openTokensModal = () => dispatch(setTokensModal(true));
  function handleAmountChange(event) {
    dispatch(setAmount(event.target.value));
  }
  const validateAmount = () => validate(dispatch);

  // amount input focus
  const amtId = 'sendAmt';
  function focusAmt() {
    const input = document.getElementById(amtId);
    if (!input) return;
    input.focus();
  }

  // balance
  useEffect(() => {
    if (!fromNetwork || !tokenConfig || !walletAddr) return;
    if (tokenConfig.tokenId) {
      getBalance(walletAddr, tokenConfig.tokenId, fromNetwork).then(
        (res: BigNumber | null) => {
          const balance = formatBalance(fromNetwork, tokenConfig, res);
          setBalance(balance[tokenConfig.symbol]);
          dispatch(setStoreBalance(balance));
        },
      );
    } else {
      getNativeBalance(walletAddr, fromNetwork).then((res: BigNumber) => {
        const balance = formatBalance(fromNetwork, tokenConfig, res);
        setBalance(balance[tokenConfig.symbol]);
        dispatch(setStoreBalance(balance));
      });
    }
  }, [tokenConfig, fromNetwork, walletAddr]);

  const networkTile = (
    <NetworkTile
      network={fromNetworkConfig}
      error={!!(showErrors && validations.fromNetwork)}
      onClick={openFromNetworksModal}
    />
  );
  const selectedToken = tokenConfig
    ? { icon: tokenConfig.icon, text: tokenConfig.symbol }
    : undefined;
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={openTokensModal}
      editable
    />
  );
  const amountInput = (
    <Input
      label="Amount"
      editable
      error={!!(showErrors && validations.amount)}
      onClick={focusAmt}
    >
      {token ? (
        <InputTransparent
          placeholder="0.00"
          id={amtId}
          type="number"
          min={0}
          step={0.1}
          onChange={handleAmountChange}
          onPause={validateAmount}
        />
      ) : (
        <div>-</div>
      )}
    </Input>
  );

  return (
    <Inputs
      title="From"
      wallet={TransferWallet.SENDING}
      walletValidations={[validations.sendingWallet]}
      inputValidations={[
        validations.fromNetwork,
        validations.token,
        validations.amount,
      ]}
      networkTile={networkTile}
      tokenInput={tokenInput}
      amountInput={amountInput}
      balance={balance}
    />
  );
}

export default FromInputs;
