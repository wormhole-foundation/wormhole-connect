import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../../../store';
import { CHAINS_ARR } from '../../../config';
import { setFromNetworksModal } from '../../../store/router';
import { setFromNetwork } from '../../../store/transfer';
import { clearWallet, setWalletError } from '../../../store/wallet';
import { TransferWallet, walletAcceptedNetworks } from '../../../utils/wallet';

import NetworksModal from '../../../components/NetworksModal';

function FromNetworksModal() {
  const dispatch = useDispatch();

  const { toNetwork } = useSelector((state: RootState) => state.transfer);
  const { sending } = useSelector((state: RootState) => state.wallet);
  const { showFromNetworksModal } = useSelector(
    (state: RootState) => state.router,
  );

  const close = () => {
    dispatch(setFromNetworksModal(false));
  };

  const isDisabled = (chain: ChainName) => {
    // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
    return !walletAcceptedNetworks[sending.type].includes(chain);
  };

  const selectNetwork = async (network: ChainName) => {
    if (isDisabled(network)) {
      dispatch(clearWallet(TransferWallet.SENDING));
      const payload = {
        type: TransferWallet.SENDING,
        error: 'Wallet disconnected, please connect a supported wallet',
      };
      dispatch(setWalletError(payload));
    }
    dispatch(setFromNetwork(network));
    dispatch(setFromNetworksModal(false));
  };

  return (
    <NetworksModal
      open={showFromNetworksModal}
      title="Sending from"
      chains={CHAINS_ARR.filter((c) => c.key !== toNetwork)}
      onSelect={selectNetwork}
      onClose={close}
      isDisabled={isDisabled}
    />
  );
}

export default FromNetworksModal;
