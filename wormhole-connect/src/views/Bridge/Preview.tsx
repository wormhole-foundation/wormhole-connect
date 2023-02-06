import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import BridgeCollapse from './Collapse';
import { CHAINS, TOKENS } from '../../sdk/config';
import { TokenConfig } from '../../config/types';
import { toFixedDecimals } from '../../utils/balance';

const getRows = (
  token: TokenConfig,
  gasToken: string,
  payment: PaymentOption,
  amount: number,
  nativeTokenAmt: number,
  receiveNativeAmt: number,
): RowsData => {
  const receivingToken = token.wrappedAsset || token.symbol;
  
  // TODO: calculate automatic receive amount
  if (payment === PaymentOption.AUTOMATIC) {
    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${amount - nativeTokenAmt}`, 6)} ${receivingToken}`,
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
            value: `TODO ${token.symbol}`,
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
  }
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
  const [state, setState] = React.useState({ rows: [] as RowsData });
  const { token, toNetwork, destGasPayment, amount, toNativeToken, receiveNativeAmt } = useSelector(
    (state: RootState) => state.transfer,
  );
  useEffect(() => {
    const destConfig = toNetwork && CHAINS[toNetwork];
    const tokenConfig = token && TOKENS[token];
    if (!tokenConfig || !destConfig || !amount) return
    if (tokenConfig && destConfig) {
      const rows = getRows(tokenConfig, destConfig!.nativeToken, destGasPayment, amount, toNativeToken, receiveNativeAmt || 0);
      setState({ rows });
    }
  }, [token, toNetwork, destGasPayment, amount, toNativeToken, receiveNativeAmt]);

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
