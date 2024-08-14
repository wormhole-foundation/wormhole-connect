import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from 'store';
import {
  setToken,
  selectFromChain,
  setAmount,
  isDisabledChain,
} from 'store/transferInput';
import config from 'config';
import { TransferWallet } from 'utils/wallet';
import { getTokenPrice, hydrateHrefTemplate } from 'utils';
import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokensModal from 'components/TokensModal';
import ChainsModal from 'components/ChainsModal';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import { Chain } from '@wormhole-foundation/sdk';

function FromInputs() {
  const dispatch = useDispatch();
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showChainsModal, setShowChainsModal] = useState(false);

  const wallet = useSelector((state: RootState) => state.wallet.sending);
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const {
    showValidationState: showErrors,
    validations,
    fromChain,
    toChain,
    token,
    amount,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);
  const tokenConfig = token && config.tokens[token];
  const tokenConfigArr = useMemo(
    () => (tokenConfig ? [tokenConfig] : []),
    [tokenConfig],
  );
  const { balances } = useGetTokenBalances(
    wallet.address,
    fromChain,
    tokenConfigArr,
  );

  const isDisabled = useCallback(
    (chain: Chain) => isDisabledChain(chain, wallet),
    [wallet],
  );

  const selectChain = async (chain: Chain) => {
    await selectFromChain(dispatch, chain, wallet);
  };

  const selectToken = (token: string) => {
    dispatch(setToken(token));
  };

  // token input jsx
  const selectedToken = useMemo(() => {
    if (!tokenConfig) return undefined;
    const chain = config.chains[tokenConfig.nativeChain]?.displayName;
    return {
      icon: tokenConfig.icon,
      text: tokenConfig.symbol,
      secondaryText: `(${chain})`,
    };
  }, [tokenConfig]);
  const tokenInput = (
    <Select
      label="Asset"
      testId="source-section-select-asset-button"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={() => setShowTokensModal(true)}
      disabled={!fromChain || isTransactionInProgress}
      editable
    />
  );

  const amountInput = (
    <AmountInput
      handleAmountChange={(amount) => dispatch(setAmount(amount))}
      value={amount}
      side="source"
    />
  );

  const handleExtraNetwork = (
    href: string,
    chainName: string,
    target = '_self',
  ) => {
    const hydratedHref = hydrateHrefTemplate(href, chainName);
    if (hydratedHref) {
      window.open(hydratedHref, target);
    }
  };

  return (
    <>
      <Inputs
        side="source"
        wallet={TransferWallet.SENDING}
        walletValidations={[validations.sendingWallet]}
        walletError={wallet.error}
        inputValidations={[
          validations.fromChain,
          validations.token,
          validations.amount,
        ]}
        chain={fromChain}
        chainValidation={validations.fromChain}
        onChainClick={() => setShowChainsModal(true)}
        tokenInput={tokenInput}
        amountInput={amountInput}
        balance={balances[token]?.balance || undefined}
        tokenPrice={getTokenPrice(prices, config.tokens[token])}
      />
      {showTokensModal && (
        <TokensModal
          open={showTokensModal}
          chain={fromChain}
          walletAddress={wallet.address}
          type="source"
          onSelect={selectToken}
          onClose={() => setShowTokensModal(false)}
        />
      )}
      <ChainsModal
        open={showChainsModal}
        title="Sending from"
        chains={config.chainsArr.filter(
          (c) => c.key !== toChain && !c.disabledAsSource,
        )}
        onSelect={selectChain}
        onClose={() => setShowChainsModal(false)}
        onMoreNetworkSelect={(href, chainName, target) =>
          handleExtraNetwork(href, chainName, target)
        }
        isDisabled={isDisabled}
      />
    </>
  );
}

export default FromInputs;
