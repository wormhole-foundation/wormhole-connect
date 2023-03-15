import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setRelayerFee } from '../../store/transfer';
import { CHAINS, TOKENS } from '../../sdk/config';
import { PaymentOption } from '../../sdk/sdk';
import { TokenConfig } from '../../config/types';
import { toDecimals, toFixedDecimals } from '../../utils/balance';
import { getRelayerFee } from '../../sdk/sdk';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import BridgeCollapse from './Collapse';

const getAutomaticRows = (
  token: TokenConfig,
  gasToken: string,
  amount: number,
  nativeTokenAmt: number,
  receiveNativeAmt: number,
  relayerFee: number,
  sendingGasEst: string,
): RowsData => {
  const receivingToken = token.wrappedAsset || token.symbol;
  const totalFees = Number.parseFloat(sendingGasEst) + relayerFee;
  return [
    {
      title: 'Amount',
      value: `${toFixedDecimals(
        `${amount - nativeTokenAmt}`,
        6,
      )} ${receivingToken}`,
    },
    {
      title: 'Native token on destination',
      value: `${receiveNativeAmt} ${gasToken}`,
    },
    {
      title: 'Total fee estimates',
      value: totalFees ? `${totalFees} ${token.symbol}` : '',
      rows: [
        {
          title: 'Relayer fee',
          value: relayerFee ? `${relayerFee} ${token.symbol}` : 'Not available',
        },
        {
          title: 'Source chain gas estimate',
          value: sendingGasEst
            ? `~ ${sendingGasEst} ${token.symbol}`
            : 'Not available',
        },
      ],
    },
  ];
};

const getManualRows = (
  token: TokenConfig,
  gasToken: string,
  amount: number,
  sendingGasEst: string,
  destGasEst: string,
): RowsData => {
  const receivingToken = token.wrappedAsset || token.symbol;

  return [
    {
      title: 'Amount',
      value: `${amount} ${receivingToken}`,
    },
    {
      title: 'Total fee estimates',
      value:
        sendingGasEst && destGasEst
          ? `${sendingGasEst} ${token.symbol} & ${destGasEst} ${gasToken}`
          : '',
      rows: [
        {
          title: 'Source chain gas estimate',
          value: sendingGasEst
            ? `~ ${sendingGasEst} ${token.symbol}`
            : 'Not available',
        },
        {
          title: 'Destination chain gas estimate',
          value: destGasEst ? `~ ${destGasEst} ${gasToken}` : 'Not available',
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
    fromNetwork,
    toNetwork,
    destGasPayment,
    amount,
    toNativeToken,
    receiveNativeAmt,
    gasEst,
  } = useSelector((state: RootState) => state.transfer);

  useEffect(() => {
    const destConfig = toNetwork && CHAINS[toNetwork];
    const tokenConfig = token && TOKENS[token];
    if (!fromNetwork || !tokenConfig || !destConfig || !amount) return;

    if (destGasPayment === PaymentOption.MANUAL) {
      const rows = getManualRows(
        tokenConfig,
        destConfig!.nativeToken,
        amount,
        gasEst.manual,
        gasEst.claim,
      );
      setState({ rows });
    } else {
      getRelayerFee(fromNetwork, toNetwork, token).then((fee) => {
        const decimals =
          fromNetwork === 'solana'
            ? tokenConfig.solDecimals
            : tokenConfig.decimals;
        const formattedFee = Number.parseFloat(toDecimals(fee, decimals, 6));
        dispatch(setRelayerFee(formattedFee));
        const rows = getAutomaticRows(
          tokenConfig,
          destConfig!.nativeToken,
          amount,
          toNativeToken,
          receiveNativeAmt || 0,
          formattedFee,
          gasEst.automatic,
        );
        setState({ rows });
      });
    }
  }, [
    token,
    fromNetwork,
    toNetwork,
    destGasPayment,
    amount,
    toNativeToken,
    receiveNativeAmt,
    gasEst,
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
