import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import { RootState } from 'store';
import {
  accessBalance,
  isDisabledChain,
  selectToChain,
  setDestToken,
} from 'store/transferInput';
import { TransferWallet } from 'utils/wallet';
import { getTokenPrice, hydrateHrefTemplate } from 'utils';
import { CHAINS, CHAINS_ARR, TOKENS } from 'config';

import Inputs from './Inputs';
import Select from './Select';
import AmountInput from './AmountInput';
import TokenWarnings from './TokenWarnings';
import TokensModal from 'components/TokensModal';
import ChainsModal from 'components/ChainsModal';
import { isPorticoRoute } from 'routes/porticoBridge/utils';

function ToInputs() {
  const dispatch = useDispatch();
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [showChainsModal, setShowChainsModal] = useState(false);

  const {
    showValidationState: showErrors,
    validations,
    fromChain,
    toChain,
    balances,
    destToken,
    receiveAmount,
    route,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);
  const receiving = useSelector((state: RootState) => state.wallet.receiving);
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const balance =
    accessBalance(balances, receiving.address, toChain, destToken) || undefined;

  const tokenConfig = TOKENS[destToken];

  const selectToken = (token: string) => {
    dispatch(setDestToken(token));
  };

  const isDisabled = useCallback(
    (chain: ChainName) => isDisabledChain(chain, receiving),
    [receiving],
  );

  const selectChain = async (chain: ChainName) => {
    selectToChain(dispatch, chain, receiving);
  };

  // token display jsx
  const selectedToken = useMemo(() => {
    if (!tokenConfig) return undefined;
    const symbol = tokenConfig.symbol;
    const chain = CHAINS[tokenConfig.nativeChain]?.displayName;
    return {
      icon: tokenConfig.icon,
      text: symbol,
      secondaryText: `(${chain})`,
    };
  }, [tokenConfig]);
  const tokenInput = (
    <Select
      label="Asset"
      selected={selectedToken}
      error={!!(showErrors && validations.token)}
      onClick={() => setShowTokensModal(true)}
      disabled={!toChain || isTransactionInProgress}
      editable
    />
  );

  // const computeSendAmount = async (value: number | string) => {
  //   if (typeof value === 'number') {
  //     dispatch(setReceiveAmount(`${value}`));
  //   } else {
  //     dispatch(setReceiveAmount(value));
  //   }
  //   const number = typeof value === 'number' ? value : Number.parseFloat(value);
  //   dispatch(setReceiveAmount(`${number}`));
  //   if (!route) {
  //     dispatch(setReceiveAmount(`${value}`));
  //     return;
  //   }
  //   const sendAmount = await RouteOperator.computeSendAmount(route, number, {
  //     toNativeToken,
  //   });
  //   dispatch(setAmount(`${sendAmount}`));
  // };

  // const handleAmountChange = useCallback(computeSendAmount, [
  //   route,
  //   toNativeToken,
  //   dispatch,
  // ]);
  // // if route changes, re-calculate the amount
  // useEffect(() => {
  //   if (!route) return;
  //   computeSendAmount(receiveAmount);
  // }, [route, receiveAmount]);
  // TODO: get compute send amount working correctly again
  const handleAmountChange = () => {
    /* noop */
  };
  const label =
    route && isPorticoRoute(route) ? 'Expected Amount (-0.05%)' : 'Amount';
  const amountInput = (
    <AmountInput
      handleAmountChange={handleAmountChange}
      value={receiveAmount.data || ''}
      disabled
      label={label}
    />
  );

  const handleExtraNetwork = (
    href: string,
    chainName: string,
    target = '_self',
  ) => {
    const hydratedHref = hydrateHrefTemplate(href, fromChain, chainName);
    if (hydratedHref) {
      window.open(hydratedHref, target);
    }
  };

  return (
    <>
      <Inputs
        title="To"
        wallet={TransferWallet.RECEIVING}
        walletValidations={[validations.receivingWallet]}
        walletError={receiving.error}
        inputValidations={[
          validations.toChain,
          validations.destToken,
          validations.relayerFee,
          validations.receiveAmount,
        ]}
        chain={toChain}
        chainValidation={validations.toChain}
        onChainClick={() => setShowChainsModal(true)}
        tokenInput={tokenInput}
        amountInput={amountInput}
        balance={balance}
        warning={<TokenWarnings />}
        tokenPrice={getTokenPrice(prices, TOKENS[destToken])}
      />
      <TokensModal
        open={showTokensModal}
        chain={toChain}
        walletAddress={receiving.address}
        type="dest"
        onSelect={selectToken}
        onClose={() => setShowTokensModal(false)}
      />
      <ChainsModal
        open={showChainsModal}
        title="Sending to"
        chains={CHAINS_ARR.filter(
          (c) => c.key !== fromChain && !c.disabledAsDestination,
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

export default ToInputs;
