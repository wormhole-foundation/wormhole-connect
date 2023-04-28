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
import { TOKENS } from '../../../config';
import { getBalance, getNativeBalance } from '../../../sdk';
import { validate } from '../../../utils/transferValidation';

import InputTransparent from '../../../components/InputTransparent';
import Inputs from './Inputs';
import Input from './Input';
import Select from './Select';

function FromInputs() {
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);

  const wallet = useSelector((state: RootState) => state.wallet.sending);
  const {
    validate: showErrors,
    validations,
    fromNetwork,
    token,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transfer);
  const tokenConfig = token && TOKENS[token];

  // set store values
  const openFromNetworksModal = () => dispatch(setFromNetworksModal(true));
  const openTokensModal = () => dispatch(setTokensModal(true));
  function handleAmountChange(event) {
    const newAmount = Number.parseFloat(event.target.value);
    dispatch(setAmount(newAmount));
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
    if (!fromNetwork || !tokenConfig || !wallet.address) {
      return setBalance(undefined);
    }
    if (tokenConfig.tokenId) {
      getBalance(wallet.address, tokenConfig.tokenId, fromNetwork).then(
        (res: BigNumber | null) => {
          const balance = formatBalance(fromNetwork, tokenConfig, res);
          setBalance(balance[tokenConfig.symbol]);
          dispatch(setStoreBalance(balance));
        },
      );
    } else {
      getNativeBalance(wallet.address, fromNetwork).then((res: BigNumber) => {
        const balance = formatBalance(fromNetwork, tokenConfig, res);
        setBalance(balance[tokenConfig.symbol]);
        dispatch(setStoreBalance(balance));
      });
    }
  }, [tokenConfig, fromNetwork, wallet.address]);

  // token input jsx
  const selectedToken = tokenConfig
    ? { icon: tokenConfig.icon, text: tokenConfig.symbol }
    : undefined;
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={openTokensModal}
      editable={!isTransactionInProgress}
      disabled={!fromNetwork || !wallet.address}
    />
  );

  // amount input jsx
  const amountInput = (
    <Input
      label="Amount"
      editable={!isTransactionInProgress}
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
          disabled={isTransactionInProgress}
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
      walletError={wallet.error}
      inputValidations={[
        validations.fromNetwork,
        validations.token,
        validations.amount,
      ]}
      network={fromNetwork}
      networkValidation={validations.fromNetwork}
      onNetworkClick={openFromNetworksModal}
      tokenInput={tokenInput}
      amountInput={amountInput}
      balance={balance}
    />
  );
}

export default FromInputs;
