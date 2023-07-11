import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { RootState } from '../../store';
import { disableAutomaticTransfer, Route } from '../../store/transferInput';
import { setRelayerFee } from '../../store/relay';
import { CHAINS, TOKENS } from '../../config';
import { TokenConfig } from '../../config/types';
import { getTokenDecimals } from '../../utils';
import { toDecimals, toFixedDecimals } from '../../utils/balance';
import { toChainId, getRelayerFee } from '../../utils/sdk';

import { RenderRows, RowsData } from '../../components/RenderRows';
import BridgeCollapse from './Collapse';
import InputContainer from '../../components/InputContainer';

const getAutomaticRows = (
  token: TokenConfig,
  destToken: TokenConfig,
  sourceGasToken: string,
  destinationGasToken: string,
  receiveAmount: number,
  receiveNativeAmt: number,
  relayerFee: number,
  sendingGasEst: string,
): RowsData => {
  const isNative = token.symbol === sourceGasToken;
  let totalFeesText = '';
  if (sendingGasEst && relayerFee) {
    const fee = toFixedDecimals(
      `${relayerFee + (isNative ? Number.parseFloat(sendingGasEst) : 0)}`,
      6,
    );
    totalFeesText = isNative
      ? `${fee} ${token.symbol}`
      : `${sendingGasEst} ${sourceGasToken} & ${fee} ${token.symbol}`;
  }

  return [
    {
      title: 'Amount',
      value: `${toFixedDecimals(`${receiveAmount}`, 6)} ${destToken.symbol}`,
    },
    {
      title: 'Native gas on destination',
      value: `${receiveNativeAmt} ${destinationGasToken}`,
    },
    {
      title: 'Total fee estimates',
      value: totalFeesText,
      rows: [
        {
          title: 'Source chain gas estimate',
          value: sendingGasEst ? `~ ${sendingGasEst} ${sourceGasToken}` : '—',
        },
        {
          title: 'Relayer fee',
          value: relayerFee ? `${relayerFee} ${token.symbol}` : '—',
        },
      ],
    },
  ];
};

const getManualRows = (
  destToken: TokenConfig,
  sourceGasToken: string,
  destinationGasToken: string,
  amount: number,
  sendingGasEst: string,
  destGasEst: string,
): RowsData => {
  return [
    {
      title: 'Amount',
      value: `${amount} ${destToken.symbol}`,
    },
    {
      title: 'Total fee estimates',
      value:
        sendingGasEst && destGasEst
          ? `${sendingGasEst} ${sourceGasToken} & ${destGasEst} ${destinationGasToken}`
          : '',
      rows: [
        {
          title: 'Source chain gas estimate',
          value: sendingGasEst
            ? `~ ${sendingGasEst} ${sourceGasToken}`
            : 'Not available',
        },
        {
          title: 'Destination chain gas estimate',
          value: destGasEst
            ? `~ ${destGasEst} ${destinationGasToken}`
            : 'Not available',
        },
      ],
    },
  ];
};

function Preview(props: { collapsed: boolean }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [state, setState] = React.useState({ rows: [] as RowsData });
  const {
    token,
    destToken,
    fromNetwork,
    toNetwork,
    route,
    receiveAmount,
    gasEst,
  } = useSelector((state: RootState) => state.transferInput);
  const { toNativeToken, receiveNativeAmt } = useSelector(
    (state: RootState) => state.relay,
  );

  useEffect(() => {
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

    if (route === Route.BRIDGE) {
      const rows = getManualRows(
        destTokenConfig,
        sourceConfig!.gasToken,
        destConfig!.gasToken,
        numReceiveAmount,
        gasEst.manual,
        gasEst.claim,
      );
      setState({ rows });
    } else {
      getRelayerFee(fromNetwork, toNetwork, token)
        .then((fee) => {
          const decimals = getTokenDecimals(
            toChainId(fromNetwork),
            tokenConfig.tokenId || 'native',
          );
          const formattedFee = Number.parseFloat(toDecimals(fee, decimals, 6));
          dispatch(setRelayerFee(formattedFee));
          const rows = getAutomaticRows(
            tokenConfig,
            destTokenConfig,
            sourceConfig!.gasToken,
            destConfig!.gasToken,
            numReceiveAmount,
            receiveNativeAmt || 0,
            formattedFee,
            gasEst.automatic,
          );
          setState({ rows });
        })
        .catch((e) => {
          if (e.message.includes('swap rate not set')) {
            dispatch(disableAutomaticTransfer());
          } else {
            throw e;
          }
        });
    }
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
  ]);

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
