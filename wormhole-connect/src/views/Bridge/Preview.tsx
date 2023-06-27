import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { RootState } from '../../store';
import { disableAutomaticTransfer, Route } from '../../store/transferInput';
import { setRelayerFee } from '../../store/relay';
import { CHAINS, TOKENS } from '../../config';
import { getTokenDecimals } from '../../utils';
import { toDecimals } from '../../utils/balance';
import { toChainId, getRelayerFee } from '../../utils/sdk';
import Operator, { TransferDisplayData } from '../../utils/routes';

import { RenderRows } from '../../components/RenderRows';
import BridgeCollapse from './Collapse';
import InputContainer from '../../components/InputContainer';

function Preview(props: { collapsed: boolean }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [state, setState] = React.useState({ rows: [] as TransferDisplayData });
  const {
    token,
    destToken,
    fromNetwork,
    toNetwork,
    route,
    receiveAmount,
    gasEst,
  } = useSelector((state: RootState) => state.transferInput);
  const { toNativeToken, receiveNativeAmt, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );

  useEffect(() => {
    const buildPreview = async () => {
      if (!fromNetwork) return;
      const sourceConfig = toNetwork && CHAINS[fromNetwork];
      const destConfig = toNetwork && CHAINS[toNetwork];
      const tokenConfig = token && TOKENS[token];
      const destTokenConfig = destToken && TOKENS[destToken];
      if (
        !tokenConfig ||
        !destTokenConfig ||
        !sourceConfig ||
        !destConfig ||
        !receiveAmount
      )
        return;
      const numReceiveAmount = Number.parseFloat(receiveAmount);

      // TODO: find a way to bundle the parameters without the need
      // of checking for a specific route.
      const rows = await new Operator().getPreview(route, {
        destToken: destTokenConfig,
        sourceGasToken: sourceConfig.gasToken,
        destinationGasToken: destConfig.gasToken,
        amount: numReceiveAmount,
        sendingGasEst:
          route === Route.BRIDGE ? gasEst.manual : gasEst.automatic,
        destGasEst: gasEst.claim,

        // relay params
        token: tokenConfig,
        receiveAmount: numReceiveAmount,
        receiveNativeAmt: receiveNativeAmt || 0,
        relayerFee,
      });

      setState({ rows });
    };

    buildPreview();
  }, [
    token,
    destToken,
    fromNetwork,
    toNetwork,
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
      try {
        if (!token || !fromNetwork || !toNetwork) return;
        const tokenConfig = token && TOKENS[token];
        if (!tokenConfig) return;

        const fee = await getRelayerFee(fromNetwork, toNetwork, token);
        const decimals = getTokenDecimals(
          toChainId(fromNetwork),
          tokenConfig.tokenId || 'native',
        );
        const formattedFee = Number.parseFloat(toDecimals(fee, decimals, 6));
        dispatch(setRelayerFee(formattedFee));
      } catch (e) {
        if (e.message.includes('swap rate not set')) {
          dispatch(disableAutomaticTransfer());
        } else {
          throw e;
        }
      }
    };
    computeRelayerFee();
  }, [token, toNetwork, fromNetwork, dispatch]);

  return (
    <BridgeCollapse
      title="Preview"
      disabled={props.collapsed}
      controlled
      value={props.collapsed}
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
