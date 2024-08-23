import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';

import config from 'config';
import { RootState } from 'store';
import { TransferDisplayData } from 'routes';

import { RenderRows } from 'components/RenderRows';
import BridgeCollapse, { CollapseControlStyle } from './Collapse';
import InputContainer from 'components/InputContainer';

const defaultPrices = {};

function Preview(props: { collapsed: boolean }) {
  const dispatch = useDispatch();
  const theme: any = useTheme();
  const [state, setState] = React.useState({ rows: [] as TransferDisplayData });
  const {
    token,
    destToken,
    amount,
    fromChain,
    toChain,
    route,
    receiveAmount,
    gasEst,
  } = useSelector((state: RootState) => state.transferInput);
  const { toNativeToken, receiveNativeAmt, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const portico = useSelector((state: RootState) => state.porticoBridge);
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || defaultPrices;
  useEffect(() => {
    let isActive = true;
    const buildPreview = async () => {
      if (!fromChain || !route || !isActive) return;
      const sourceConfig = toChain && config.chains[fromChain];
      const destConfig = toChain && config.chains[toChain];
      const tokenConfig = token && config.tokens[token];
      const destTokenConfig = destToken && config.tokens[destToken];
      if (!tokenConfig || !destTokenConfig || !sourceConfig || !destConfig)
        return;

      const rows = await config.routes
        .get(route)
        .getPreview(
          tokenConfig,
          destTokenConfig,
          Number.parseFloat(amount),
          fromChain,
          toChain,
          gasEst.send,
          gasEst.claim,
          receiveAmount.data || '',
          prices,
          relayerFee,
          receiveNativeAmt,
        );

      if (isActive) {
        setState({ rows });
      }
    };
    buildPreview();
    return () => {
      isActive = false;
    };
  }, [
    token,
    destToken,
    amount,
    fromChain,
    toChain,
    route,
    receiveAmount,
    toNativeToken,
    receiveNativeAmt,
    portico,
    gasEst,
    dispatch,
    relayerFee,
    prices,
  ]);

  /*
  useEffect(() => {
    let isActive = true;
    const computeRelayerFee = async () => {
      if (!token || !fromChain || !toChain || !route || !isActive) return;
      // don't bother if it's not an automatic route
      const r = RouteOperator.getRoute(route);
      if (!r.AUTOMATIC_DEPOSIT) return;

      try {
        const tokenConfig = token && config.tokens[token];
        if (!tokenConfig) return;

        const result = await RouteOperator.getRelayerFee(
          route,
          fromChain,
          toChain,
          token,
          destToken,
          amount,
        );
        if (result === null) return;
        const { fee, feeToken } = result;
        const decimals = getTokenDecimals(toChainId(fromChain), feeToken);
        const formattedFee = Number.parseFloat(toDecimals(fee, decimals, 6));
        if (isActive) {
          dispatch(setRelayerFee(formattedFee));
          console.log('setting relayer fee', formattedFee);
        }
      } catch (e: any) {
        // change to manual if the token is not available either on the relayer
        // or the wormhole bridge
        if (
          e.message === TokenNotSupportedForRelayError.MESSAGE ||
          e.message === TokenNotRegisteredError.MESSAGE
        ) {
          if (isActive) {
            if (route === Route.CCTPRelay) {
              dispatch(setTransferRoute(Route.CCTPManual));
            } else {
              dispatch(setTransferRoute(Route.Bridge));
            }
          }
        } else {
          console.error('Failed to get relayer fee', e);
          throw e;
        }
      }
    };
    computeRelayerFee();
    return () => {
      isActive = false;
    };
  }, [route, token, destToken, toChain, fromChain, amount, dispatch]);
  */

  return (
    <BridgeCollapse
      title="Preview"
      disabled={props.collapsed}
      controlled
      value={props.collapsed}
      controlStyle={CollapseControlStyle.None}
    >
      <InputContainer
        styles={{
          boxShadow: 'none',
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0',
        }}
        bg={theme.palette.options.select}
      >
        <RenderRows rows={state.rows} />
      </InputContainer>
    </BridgeCollapse>
  );
}

export default Preview;
