import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'ethers';
import { RootState } from '../../../store';
import { setToNetworksModal } from '../../../store/router';
import { TransferWallet } from '../../../utils/wallet';
import { TOKENS } from '../../../sdk/config';
import { getBalance } from '../../../sdk/sdk';
import { formatBalance } from '../../../store/transfer';

import Inputs from './Inputs';
import Input from './Input';
import Select from './Select';
import InputTransparent from '../../../components/InputTransparent';
import { getWrappedToken } from '../../../utils';

function ToInputs() {
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);

  const { validations, fromNetwork, toNetwork, token, amount } = useSelector(
    (state: RootState) => state.transfer,
  );
  const wallet = useSelector((state: RootState) => state.wallet.receiving);

  const tokenConfig = TOKENS[token];

  const openToNetworksModal = () => dispatch(setToNetworksModal(true));

  // get balance on destination chain
  useEffect(() => {
    if (!fromNetwork || !toNetwork || !tokenConfig || !wallet.address) {
      return setBalance(undefined);
    }
    const { tokenId } = tokenConfig.tokenId
      ? tokenConfig
      : TOKENS[tokenConfig.wrappedAsset!];
    getBalance(wallet.address, tokenId!, toNetwork).then(
      (res: BigNumber | null) => {
        const balance = formatBalance(toNetwork, tokenConfig, res);
        setBalance(balance[tokenConfig.symbol]);
      },
    );
  }, [tokenConfig, fromNetwork, toNetwork, wallet.address]);

  // token display jsx
  const symbol = tokenConfig && getWrappedToken(tokenConfig).symbol;
  const selectedToken = tokenConfig
    ? { icon: tokenConfig.icon, text: symbol }
    : undefined;
  const tokenInput = <Select label="Asset" selected={selectedToken} />;

  // amount display jsx
  const amountInput = (
    <Input label="Amount">
      <InputTransparent placeholder="-" disabled value={amount || ''} />
    </Input>
  );

  return (
    <Inputs
      title="To"
      wallet={TransferWallet.RECEIVING}
      walletValidations={[validations.receivingWallet]}
      walletError={wallet.error}
      inputValidations={[validations.toNetwork]}
      network={toNetwork}
      networkValidation={validations.toNetwork}
      onNetworkClick={openToNetworksModal}
      tokenInput={tokenInput}
      amountInput={amountInput}
      balance={balance}
    />
  );
}

export default ToInputs;
