import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { RootState } from 'store';
import {
  setToken,
  selectFromChain,
  setAmount,
  setReceiveAmount,
  accessBalance,
  setFetchingReceiveAmount,
  setReceiveAmountError,
  isDisabledChain,
} from 'store/transferInput';
import { CHAINS, CHAINS_ARR, TOKENS } from 'config';
import { TransferWallet } from 'utils/wallet';
import RouteOperator from 'routes/operator';
import { getTokenPrice, hydrateHrefTemplate } from 'utils';
import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokensModal from 'components/TokensModal';
import ChainsModal from 'components/ChainsModal';
import { isPorticoRoute } from 'routes/porticoBridge/utils';

function FromInputs() {
  const dispatch = useDispatch();
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showChainsModal, setShowChainsModal] = useState(false);

  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const portico = useSelector((state: RootState) => state.porticoBridge);
  const wallet = useSelector((state: RootState) => state.wallet.sending);
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const {
    showValidationState: showErrors,
    validations,
    route,
    fromChain,
    toChain,
    balances,
    token,
    amount,
    isTransactionInProgress,
    destToken,
  } = useSelector((state: RootState) => state.transferInput);
  const tokenConfig = token && TOKENS[token];
  const balance =
    accessBalance(balances, wallet.address, fromChain, token) || undefined;

  const isDisabled = useCallback(
    (chain: ChainName) => isDisabledChain(chain, wallet),
    [wallet],
  );

  const selectChain = async (chain: ChainName) => {
    selectFromChain(dispatch, chain, wallet);
  };

  const selectToken = (token: string) => {
    dispatch(setToken(token));
  };

  // token input jsx
  const selectedToken = useMemo(() => {
    if (!tokenConfig) return undefined;
    const chain = CHAINS[tokenConfig.nativeChain as ChainName]?.displayName;
    return {
      icon: tokenConfig.icon,
      text: tokenConfig.symbol,
      secondaryText: `(${chain})`,
    };
  }, [tokenConfig]);
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={() => setShowTokensModal(true)}
      disabled={!fromChain || isTransactionInProgress}
      editable
    />
  );

  const computeReceiveAmount = useCallback(
    async (value: number | string) => {
      if (typeof value === 'number') {
        dispatch(setAmount(`${value}`));
      } else {
        dispatch(setAmount(value));
      }
      const number =
        typeof value === 'number' ? value : Number.parseFloat(value);
      if (!route) {
        dispatch(setReceiveAmount(`${value}`));
        return;
      }
      try {
        const routeOptions = isPorticoRoute(route)
          ? portico
          : { toNativeToken, relayerFee };
        dispatch(setFetchingReceiveAmount());
        const receiveAmount = await RouteOperator.computeReceiveAmount(
          route,
          number,
          token,
          destToken,
          fromChain,
          toChain,
          routeOptions,
        );
        dispatch(setReceiveAmount(`${receiveAmount}`));
      } catch {
        dispatch(setReceiveAmountError('Error computing receive amount'));
      }
    },
    [
      dispatch,
      toNativeToken,
      relayerFee,
      route,
      token,
      destToken,
      toChain,
      fromChain,
      portico,
    ],
  );

  // TODO: clean up the send/receive amount set logic
  const handleAmountChange = useCallback(computeReceiveAmount, [
    route,
    toNativeToken,
    relayerFee,
    dispatch,
    computeReceiveAmount,
  ]);
  // if route changes, re-calculate the amount
  useEffect(() => {
    if (!route) return;
    computeReceiveAmount(amount);
  }, [route, amount, computeReceiveAmount]);
  const amountInput = (
    <AmountInput handleAmountChange={handleAmountChange} value={amount} />
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
        title="From"
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
        balance={balance}
        tokenPrice={getTokenPrice(prices, TOKENS[token])}
      />
      <TokensModal
        open={showTokensModal}
        chain={fromChain}
        walletAddress={wallet.address}
        type="source"
        onSelect={selectToken}
        onClose={() => setShowTokensModal(false)}
      />
      <ChainsModal
        open={showChainsModal}
        title="Sending from"
        chains={CHAINS_ARR.filter(
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
