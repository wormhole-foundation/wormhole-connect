import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setToNetworksModal } from '../../../store/router';
import { TransferWallet } from '../../../utils/wallet';
import { CHAINS, TOKENS } from '../../../sdk/config';

import NetworkTile from '../NetworkTile';
import Inputs from './Layout';
import Input from './Input';
import Select from './Select';
import { getBalance } from '../../../sdk/sdk';
import { BigNumber } from 'ethers';
import { formatBalance } from '../../../store/transfer';

function ToInputs() {
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);

  const {
    validate: showErrors,
    validations,
    fromNetwork,
    toNetwork,
    token,
    amount,
  } = useSelector((state: RootState) => state.transfer);
  const walletAddr = useSelector(
    (state: RootState) => state.wallet.receiving.address,
  );

  // get networks configs
  const toNetworkConfig = toNetwork ? CHAINS[toNetwork] : undefined;
  const tokenConfig = TOKENS[token];

  const openToNetworksModal = () => dispatch(setToNetworksModal(true));

  // balance
  useEffect(() => {
    if (!fromNetwork || !toNetwork || !tokenConfig || !walletAddr) return;
    if (tokenConfig.tokenId) {
      getBalance(walletAddr, tokenConfig.tokenId, toNetwork).then(
        (res: BigNumber | null) => {
          const balance = formatBalance(fromNetwork, tokenConfig, res);
          setBalance(balance[tokenConfig.symbol]);
        },
      );
    } else if (tokenConfig.wrappedAsset) {
      const wrappedConfig = TOKENS[tokenConfig.wrappedAsset];
      if (wrappedConfig && wrappedConfig.tokenId) {
        getBalance(walletAddr, wrappedConfig.tokenId, toNetwork).then(
          (res: BigNumber | null) => {
            const balance = formatBalance(fromNetwork, tokenConfig, res);
            setBalance(balance[tokenConfig.symbol]);
          },
        );
      }
    }
  }, [tokenConfig, fromNetwork, toNetwork, walletAddr]);

  const networkTile = (
    <NetworkTile
      network={toNetworkConfig}
      error={!!(showErrors && validations.toNetwork)}
      onClick={openToNetworksModal}
    />
  );
  const selectedToken = tokenConfig
    ? { icon: tokenConfig.icon, text: tokenConfig.symbol }
    : undefined;
  const tokenInput = <Select label="Asset" selected={selectedToken} />;
  const amountInput = (
    <Input label="Amount">
      <div>{token && amount ? amount : '-'}</div>
    </Input>
  );

  return (
    <Inputs
      title="To"
      wallet={TransferWallet.RECEIVING}
      walletValidations={[validations.receivingWallet]}
      inputValidations={[validations.toNetwork]}
      networkTile={networkTile}
      tokenInput={tokenInput}
      amountInput={amountInput}
      balance={balance}
    />
  );
}

export default ToInputs;
