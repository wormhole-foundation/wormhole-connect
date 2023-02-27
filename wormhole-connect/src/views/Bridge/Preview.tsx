import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption, setRelayerFee } from '../../store/transfer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import BridgeCollapse from './Collapse';
import { CHAINS, TOKENS } from '../../sdk/config';
import { TokenConfig } from '../../config/types';
import { toDecimals, toFixedDecimals } from '../../utils/balance';
import { getRelayerFee } from '../../sdk/sdk';
import { useDispatch } from 'react-redux';

const getAutomaticRows = (
  token: TokenConfig,
  gasToken: string,
  amount: number,
  nativeTokenAmt: number,
  receiveNativeAmt: number,
  relayerFee: number,
): RowsData => {
  const receivingToken = token.wrappedAsset || token.symbol;
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
      title: 'Total fee estimate',
      value: `TODO ${token.symbol}`,
      rows: [
        {
          title: 'Relayer fee',
          value: `${relayerFee} ${token.symbol}`,
        },
        {
          title: 'Source chain gas estimate',
          value: `~ TODO ${token.symbol}`,
        },
        {
          title: 'Destination chain gas estimate',
          value: `~ TODO ${token.symbol}`,
        },
      ],
    },
  ];
};

const getManualRows = (
  token: TokenConfig,
  gasToken: string,
  amount: number,
): RowsData => {
  const receivingToken = token.wrappedAsset || token.symbol;

  return [
    {
      title: 'Amount',
      value: `${amount} ${receivingToken}`,
    },
    {
      title: 'Total fee estimates',
      value: `TODO ${token.symbol} & TODO ${gasToken}`,
      rows: [
        {
          title: 'Source chain gas estimate',
          value: `~ TODO ${token.symbol}`,
        },
        {
          title: 'Destination chain gas estimate',
          value: `~ TODO ${gasToken}`,
        },
      ],
    },
  ];
};

function Preview(props: { collapsed: boolean }) {
  const dispatch = useDispatch();
  const [state, setState] = React.useState({ rows: [] as RowsData });
  const {
    token,
    fromNetwork,
    toNetwork,
    destGasPayment,
    amount,
    toNativeToken,
    receiveNativeAmt,
  } = useSelector((state: RootState) => state.transfer);

  useEffect(() => {
    const destConfig = toNetwork && CHAINS[toNetwork];
    const tokenConfig = token && TOKENS[token];
    if (!fromNetwork || !tokenConfig || !destConfig || !amount) return;

    if (destGasPayment === PaymentOption.MANUAL) {
      const rows = getManualRows(tokenConfig, destConfig!.nativeToken, amount);
      setState({ rows });
    } else {
      getRelayerFee(fromNetwork, toNetwork, token).then((fee) => {
        const decimals = fromNetwork === 'solana' ? tokenConfig.decimals : tokenConfig.solDecimals;
        const formattedFee = Number.parseFloat(
          toDecimals(fee, decimals, 6),
        );
        dispatch(setRelayerFee(formattedFee));
        const rows = getAutomaticRows(
          tokenConfig,
          destConfig!.nativeToken,
          amount,
          toNativeToken,
          receiveNativeAmt || 0,
          formattedFee,
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
  ]);

  return (
    <BridgeCollapse
      title="Preview"
      disabled={props.collapsed}
      controlled
      value={props.collapsed}
    >
      <InputContainer border styles={{ boxShadow: 'none' }}>
        <RenderRows rows={state.rows} />
      </InputContainer>
    </BridgeCollapse>
  );
}

export default Preview;
