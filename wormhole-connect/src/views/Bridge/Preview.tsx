import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';

import { RootState } from 'store';
import { setTransferRoute } from 'store/transferInput';
import { setRelayerFee } from 'store/relay';
import { CHAINS, TOKENS } from 'config';
import { Route } from 'config/types';
import { getTokenDecimals } from 'utils';
import { toDecimals } from 'utils/balance';
import { toChainId } from 'utils/sdk';
import { TransferDisplayData } from 'utils/routes';
import RouteOperator from 'utils/routes/operator';

import { RenderRows } from 'components/RenderRows';
import BridgeCollapse, { CollapseControlStyle } from './Collapse';
import InputContainer from 'components/InputContainer';

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

  useEffect(() => {
    const buildPreview = async () => {
      if (!fromChain || !route) return;
      const sourceConfig = toChain && CHAINS[fromChain];
      const destConfig = toChain && CHAINS[toChain];
      const tokenConfig = token && TOKENS[token];
      const destTokenConfig = destToken && TOKENS[destToken];
      if (!tokenConfig || !destTokenConfig || !sourceConfig || !destConfig)
        return;

      const routeOptions = {
        toNativeToken,
        receiveNativeAmt,
        relayerFee,
      };
      const rows = await RouteOperator.getPreview(
        route,
        tokenConfig,
        destTokenConfig,
        Number.parseFloat(amount),
        fromChain,
        toChain,
        gasEst.send,
        gasEst.claim,
        routeOptions,
      );

      setState({ rows });
    };

    buildPreview();
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
    gasEst,
    dispatch,
    relayerFee,
  ]);

  useEffect(() => {
    const computeRelayerFee = async () => {
      if (!token || !fromChain || !toChain || !route) return;
      // don't bother if it's not an automatic route
      const r = RouteOperator.getRoute(route);
      if (!r.isAutomatic(fromChain, toChain)) return;

      try {
        const tokenConfig = token && TOKENS[token];
        if (!tokenConfig) return;

        const fee = await RouteOperator.getRelayerFee(
          route,
          fromChain,
          toChain,
          token,
        );
        const decimals = getTokenDecimals(
          toChainId(fromChain),
          tokenConfig.tokenId || 'native',
        );
        const formattedFee = Number.parseFloat(toDecimals(fee, decimals, 6));
        dispatch(setRelayerFee(formattedFee));
      } catch (e: any) {
        if (e.message.includes('swap rate not set')) {
          if (route === Route.CCTPRelay) {
            dispatch(setTransferRoute(Route.CCTPManual));
          } else {
            dispatch(setTransferRoute(Route.Bridge));
          }
        } else {
          throw e;
        }
      }
    };
    computeRelayerFee();
  }, [route, token, toChain, fromChain, dispatch]);

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
