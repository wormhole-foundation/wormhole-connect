import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../../store';
import { CHAINS_ARR } from '../../../sdk/config';
import { setToNetworksModal } from '../../../store/router';
import { setToNetwork } from '../../../store/transfer';
import { clearWallet } from '../../../store/wallet';
import { TransferWallet, walletAcceptedNetworks } from '../../../utils/wallet';

import NetworksModal from '../../../components/NetworksModal';

function ToNetworksModal() {
  const dispatch = useDispatch();

  const { fromNetwork } = useSelector((state: RootState) => state.transfer);
  const { receiving } = useSelector((state: RootState) => state.wallet);
  const { showToNetworksModal } = useSelector(
    (state: RootState) => state.router,
  );

  const close = () => {
    dispatch(setToNetworksModal(false));
  };

  const isDisabled = (chain: ChainName) => {
    // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
    return !walletAcceptedNetworks[receiving.type].includes(chain);
  };

  const selectNetwork = async (network: ChainName) => {
    if (isDisabled(network)) {
      dispatch(clearWallet(TransferWallet.RECEIVING));
    }
    dispatch(setToNetwork(network));
    dispatch(setToNetworksModal(false));
  };

  return (
    <NetworksModal
      open={showToNetworksModal}
      title="Sending to"
      chains={CHAINS_ARR.filter((c) => c.key !== fromNetwork)}
      onSelect={selectNetwork}
      onClose={close}
      isDisabled={isDisabled}
    />
  );
}

export default ToNetworksModal;
